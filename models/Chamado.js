import mongoose from 'mongoose';

const TimelineSchema = new mongoose.Schema({
  data: { type: String, required: true },
  atendente: { type: String, required: true },
  obs: { type: String, required: true },
  tipo: { type: String, default: 'normal' }
}, { timestamps: true });

const ChamadoSchema = new mongoose.Schema({
  pedido: { type: String, required: true, unique: true, index: true },
  nf: { type: String },
  bling: { type: String, maxlength: 30 },
  ticket: { type: String },
  atendenteCriacao: { type: String, required: true },
  dataCriacao: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['', 'EM ANÁLISE', 'REPASSADO', 'FINALIZADO', 'RETOR. CLIEN', 'AGENDADO'],
    default: '' // Inicia sem status em branco
  },
  resolucao: { type: String, default: '' },
  timeline: [TimelineSchema],
}, { timestamps: true });

export default mongoose.models.Chamado || mongoose.model('Chamado', ChamadoSchema);