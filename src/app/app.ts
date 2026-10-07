import { Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

export interface Atividade {
  cod: string;
  nome: string;
  max: number;
  /** Horas por unidade (null = o usuário informa as horas) */
  por: number | null;
  unidade: string;
  regra: string;
}

export interface Certificado {
  id: string;
  cod: string;
  titulo: string;
  /** Horas informadas ou quantidade de unidades (visitas, monitorias etc.) */
  qtd: number;
}

interface Estado {
  ppc2012: boolean;
  meta: number;
  itens: Certificado[];
}

const STORAGE_KEY = 'horas-complementares-v1';
const COD_PPC_2012 = 'ATCO1295';
const CIRCUNFERENCIA = 326.7;

// Resolução COLCOCOM nº 8/2025 – Tabela 1
export const ATIVIDADES: Atividade[] = [
  { cod: 'ATCO0725', nome: 'Visitas técnicas orientadas', max: 30, por: 2, unidade: 'visita', regra: '2h por visita. Validada por relatório técnico e/ou certificado da empresa.' },
  { cod: 'ATCO0439', nome: 'Ouvinte em minicursos, cursos de extensão, oficinas, colóquios e palestras', max: 60, por: null, unidade: '', regra: 'Número de horas realizadas. Validada por certificado.' },
  { cod: 'ATCO0706', nome: 'Projetos institucionais (FACOM – Techweek)', max: 60, por: null, unidade: '', regra: 'Número de horas realizadas. Validada por certificado.' },
  { cod: 'ATCO0199', nome: 'Curso de línguas', max: 60, por: null, unidade: '', regra: 'Horas-aula realizadas. Validada por declaração da escola ou professor particular.' },
  { cod: 'ATCO0506', nome: 'Participação em congressos', max: 40, por: null, unidade: '', regra: 'Número de horas realizadas. Validada por certificado.' },
  { cod: 'ATCO0753', nome: 'Programa de Educação Tutorial (PET)', max: 60, por: null, unidade: '', regra: 'Número de horas realizadas. Validada por certificado.' },
  { cod: 'ATCO0523', nome: 'Empresa júnior', max: 60, por: null, unidade: '', regra: 'Número de horas realizadas. Validada por certificado.' },
  { cod: 'ATCO0002', nome: 'Estágio não obrigatório', max: 60, por: null, unidade: '', regra: 'Número de horas realizadas. Validado por certificado ou relatório.' },
  { cod: 'ATCO0473', nome: 'Atividades profissionais', max: 60, por: null, unidade: '', regra: 'Validação a critério do supervisor ou coordenador. Exige relatório técnico, relatório da empresa e comprovação de vínculo.' },
  { cod: 'ATCO0663', nome: 'Projeto de Pesquisa / Iniciação Científica', max: 40, por: null, unidade: '', regra: 'Número de horas realizadas. Validada por certificado.' },
  { cod: 'ATCO0077', nome: 'Monitoria em disciplinas de graduação', max: 60, por: 40, unidade: 'monitoria', regra: '40h por monitoria. Validada por certificado.' },
  { cod: 'ATCO0083', nome: 'Atividades acadêmicas à distância', max: 40, por: null, unidade: '', regra: 'O curso deve ter conteúdo programático, objetivo, ementa, plano de ensino e professor qualificado.' },
  { cod: 'ATCO1007', nome: 'Representação discente em órgãos colegiados da UFU', max: 30, por: null, unidade: '', regra: 'Número de horas realizadas. Validada por certificado.' },
  { cod: 'ATCO0490', nome: 'Competições culturais, artísticas ou esportivas', max: 40, por: null, unidade: '', regra: 'Número de horas realizadas. Validada por certificado.' },
  { cod: 'ATCO0043', nome: 'Apresentação de trabalhos em eventos científicos', max: 40, por: 10, unidade: 'apresentação', regra: '10h por apresentação. Validada por certificado.' },
  { cod: 'ATCO0974', nome: 'Publicação em eventos científicos', max: 40, por: 10, unidade: 'publicação', regra: '10h por publicação. Validada por cópia da publicação.' },
  { cod: 'ATCO0120', nome: 'Atividades de natureza social, cultural e artística e áreas afins', max: 40, por: null, unidade: '', regra: 'Validação a critério do professor orientador ou coordenador.' },
  { cod: 'ATCO0240', nome: 'Disciplina facultativa cursada com aproveitamento', max: 50, por: 25, unidade: 'disciplina', regra: '25h por disciplina. Aprovação comprovada no histórico escolar.' },
  { cod: 'ATCO0364', nome: 'Nivelamento (matemática e outros aprovados pelo colegiado)', max: 60, por: null, unidade: '', regra: 'Participação comprovada pelo professor responsável.' },
  { cod: 'ATCO0128', nome: 'Atividades humanísticas', max: 40, por: null, unidade: '', regra: 'Validação a critério do professor orientador ou coordenador.' },
  { cod: 'ATCO0372', nome: 'Organização de eventos científicos, cursos, palestras etc.', max: 40, por: null, unidade: '', regra: 'Número de horas realizadas. Validada por certificado.' },
  { cod: 'ATCO0335', nome: 'Ministrante de curso, minicurso, palestra ou oficina', max: 40, por: null, unidade: '', regra: 'Número de horas realizadas. Validada por certificado.' },
  { cod: 'ATCO1090', nome: 'Maratonas de Programação', max: 40, por: null, unidade: '', regra: 'Número de horas realizadas. Validada por certificado.' },
  { cod: 'ATCO1295', nome: 'Colaborador/voluntário em projetos de pesquisa, ensino e extensão', max: 30, por: null, unidade: '', regra: 'Número de horas realizadas. Válida apenas para o PPC versão 2012/1.' },
  { cod: 'ATCO1018', nome: 'Representante discente em comissões internas', max: 20, por: null, unidade: '', regra: 'Número de horas realizadas. Validada por certificado.' },
  { cod: 'ATCO1011', nome: 'Participação estudantil em Conselho, Colegiado, Assembleia, DA ou DCE', max: 30, por: null, unidade: '', regra: 'Número de horas realizadas. Validada por certificado.' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  readonly circunferencia = CIRCUNFERENCIA;

  // Estado persistido
  readonly ppc2012 = signal(false);
  readonly meta = signal(70); // O valor oficial é definido pelo PPC do curso
  readonly itens = signal<Certificado[]>([]);

  // Formulário
  tipo = ATIVIDADES[0].cod;
  titulo = '';
  qtd: number | null = null;
  editandoId: string | null = null;
  erro = '';

  // Derivados
  readonly atividadesDisponiveis = computed(() =>
    ATIVIDADES.filter((a) => a.cod !== COD_PPC_2012 || this.ppc2012()),
  );

  readonly resumo = computed(() => {
    const brutoPorCod = new Map<string, number>();
    for (const item of this.itens()) {
      brutoPorCod.set(item.cod, (brutoPorCod.get(item.cod) ?? 0) + this.horasDoItem(item));
    }

    let total = 0;
    let descartadas = 0;
    const categorias = [...brutoPorCod.entries()]
      .map(([cod, bruto]) => {
        const atividade = this.atividade(cod)!;
        const contabilizado = Math.min(bruto, atividade.max);
        total += contabilizado;
        descartadas += bruto - contabilizado;
        return { atividade, bruto, contabilizado };
      })
      .sort((a, b) => b.contabilizado - a.contabilizado);

    return { categorias, brutoPorCod, total, descartadas };
  });

  readonly progresso = computed(() => Math.min(this.resumo().total / this.meta(), 1));
  readonly dashOffset = computed(() => CIRCUNFERENCIA * (1 - this.progresso()));

  constructor() {
    this.carregar();
    effect(() => {
      const estado: Estado = {
        ppc2012: this.ppc2012(),
        meta: this.meta(),
        itens: this.itens(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
      } catch {
        /* armazenamento indisponível */
      }
    });
  }

  // ---------- Regras ----------
  atividade(cod: string): Atividade | undefined {
    return ATIVIDADES.find((a) => a.cod === cod);
  }

  get atividadeSelecionada(): Atividade {
    return this.atividade(this.tipo) ?? ATIVIDADES[0];
  }

  horasDoItem(item: Certificado): number {
    const a = this.atividade(item.cod);
    if (!a) return 0;
    if (a.cod === COD_PPC_2012 && !this.ppc2012()) return 0; // só vale no PPC 2012/1
    return a.por ? item.qtd * a.por : item.qtd;
  }

  excedeLimite(cod: string): boolean {
    const a = this.atividade(cod);
    return !!a && (this.resumo().brutoPorCod.get(cod) ?? 0) > a.max;
  }

  detalheUnidades(item: Certificado): string {
    const a = this.atividade(item.cod);
    if (!a?.por) return '';
    return `${item.qtd} ${a.unidade}${item.qtd > 1 ? 's' : ''} × ${a.por}h`;
  }

  // ---------- Ações ----------
  salvar(): void {
    const titulo = this.titulo.trim();
    const qtd = Number(this.qtd);
    const a = this.atividadeSelecionada;

    if (!titulo) {
      this.erro = 'Informe o título do certificado.';
      return;
    }
    if ( qtd < 1) {
      this.erro = `Informe ${a.por ? 'a quantidade' : 'a carga horária'} como número inteiro maior que zero.`;
      return;
    }
    this.erro = '';

    if (this.editandoId) {
      const id = this.editandoId;
      this.itens.update((lista) =>
        lista.map((i) => (i.id === id ? { ...i, cod: this.tipo, titulo, qtd } : i)),
      );
    } else {
      this.itens.update((lista) => [...lista, { id: this.novoId(), cod: this.tipo, titulo, qtd }]);
    }
    this.limparFormulario();
  }

  editar(item: Certificado): void {
    if (item.cod === COD_PPC_2012) this.ppc2012.set(true);
    this.editandoId = item.id;
    this.tipo = item.cod;
    this.titulo = item.titulo;
    this.qtd = item.qtd;
    this.erro = '';
    document.getElementById('registrar')?.scrollIntoView({ behavior: 'smooth' });
  }

  remover(item: Certificado): void {
    if (!confirm('Remover este certificado?')) return;
    this.itens.update((lista) => lista.filter((i) => i.id !== item.id));
    if (this.editandoId === item.id) this.limparFormulario();
  }

  cancelarEdicao(): void {
    this.limparFormulario();
  }

  alterarMeta(valor: number | string): void {
    const n = Math.round(Number(valor));
    if (n > 0) this.meta.set(n);
  }

  alterarPpc2012(ativo: boolean): void {
    const temItens = this.itens().some((i) => i.cod === COD_PPC_2012);
    if (!ativo && temItens) {
      const ok = confirm(
        'Há certificados do tipo "Colaborador/voluntário" que só valem no PPC 2012/1. Eles deixarão de ser contabilizados. Continuar?',
      );
      if (!ok) return;
    }
    this.ppc2012.set(ativo);
    if (!ativo && this.tipo === COD_PPC_2012) this.tipo = ATIVIDADES[0].cod;
  }

  // ---------- Internos ----------
  private limparFormulario(): void {
    this.editandoId = null;
    this.titulo = '';
    this.qtd = null;
    this.erro = '';
  }

  private novoId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  private carregar(): void {
    try {
      const bruto = localStorage.getItem(STORAGE_KEY);
      if (!bruto) return;
      const estado = JSON.parse(bruto) as Partial<Estado>;
      if (Array.isArray(estado.itens)) this.itens.set(estado.itens);
      if (typeof estado.meta === 'number' && estado.meta > 0) this.meta.set(estado.meta);
      if (typeof estado.ppc2012 === 'boolean') this.ppc2012.set(estado.ppc2012);
    } catch {
      /* dados corrompidos: começa vazio */
    }
  }
}
