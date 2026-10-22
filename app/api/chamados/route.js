import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chamado from '@/models/Chamado';

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const pedido = searchParams.get('pedido');

  try {
    if (pedido) {
      const chamadoUnico = await Chamado.findOne({ pedido });
      return NextResponse.json({ success: true, data: chamadoUnico ? [chamadoUnico] : [] });
    }

    const chamados = await Chamado.find({});
    
    // Regra de prioridade rigorosa
    chamados.sort((a, b) => {
      const getPesoStatus = (status) => {
        const s = status || 'NOVO/REABERTO';
        if (s === 'EM ANÁLISE') return 1;
        if (s === 'NOVO/REABERTO') return 2;
        return 3;
      };

      const pesoA = getPesoStatus(a.status);
      const pesoB = getPesoStatus(b.status);

      if (pesoA !== pesoB) {
        return pesoA - pesoB;
      }

      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    return NextResponse.json({ success: true, data: chamados });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  await dbConnect();
  try {
    const body = await request.json();
    const { pedido, atendente, obs, nf, bling, ticket, resolucao } = body;

    const existente = await Chamado.findOne({ pedido });
    if (existente) {
      return NextResponse.json({ 
        success: false, 
        duplicado: true, 
        message: 'Pedido já registado!', 
        data: existente 
      }, { status: 400 });
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const resolucaoPadrao = resolucao || `Pedido: ${pedido}\nBling: ${bling || '-'}\nNF: ${nf || '-'}\n`;

    const novoChamado = await Chamado.create({
      pedido,
      nf,
      bling,
      ticket,
      atendenteCriacao: atendente,
      dataCriacao: dataAtual,
      status: 'NOVO/REABERTO', // Força explicitamente a string
      resolucao: resolucaoPadrao,
      timeline: [{ data: dataAtual, atendente, obs, tipo: 'normal' }]
    });

    return NextResponse.json({ success: true, data: novoChamado }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request) {
  await dbConnect();
  try {
    const body = await request.json();
    const { id, novaObs, atendenteAtualizacao, status, resolucao, nf, bling, ticket, editarTimelineId, novaObsEditada } = body;

    const chamado = await Chamado.findById(id);
    if (!chamado) {
      return NextResponse.json({ success: false, error: 'Chamado não encontrado' }, { status: 404 });
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');

    if (editarTimelineId) {
      const itemTimeline = chamado.timeline.id(editarTimelineId);
      if (itemTimeline) {
        itemTimeline.obs = novaObsEditada;
      }
    }

    if (novaObs && atendenteAtualizacao) {
      chamado.timeline.push({ data: dataAtual, atendente: atendenteAtualizacao, obs: novaObs, tipo: 'normal' });
    }

    if (resolucao !== undefined && resolucao !== chamado.resolucao) {
      chamado.resolucao = resolucao;
      const linhas = resolucao.split('\n').filter(l => l.trim() !== '' && !l.startsWith('Pedido:') && !l.startsWith('Bling:') && !l.startsWith('NF:'));
      const textoComentario = linhas.join(' ');

      if (textoComentario.trim() !== '') {
        chamado.timeline.push({ 
          data: dataAtual, 
          atendente: 'WESLEY', 
          obs: textoComentario, 
          tipo: 'resolucao' 
        });
      }
    }

    // Se o status vier vazio ou null, converte explicitamente para NOVO/REABERTO
    if (status !== undefined) {
      chamado.status = (!status || status === '') ? 'NOVO/REABERTO' : status;
    }
    
    if (nf !== undefined) chamado.nf = nf;
    if (bling !== undefined) chamado.bling = bling;
    if (ticket !== undefined) chamado.ticket = ticket;

    await chamado.save();

    return NextResponse.json({ success: true, data: chamado });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const timelineId = searchParams.get('timelineId');

  try {
    if (timelineId && id) {
      const chamado = await Chamado.findById(id);
      if (chamado) {
        chamado.timeline.pull({ _id: timelineId });
        await chamado.save();
        return NextResponse.json({ success: true, message: 'Item da timeline excluído' });
      }
    }

    await Chamado.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Chamado excluído com sucesso' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
