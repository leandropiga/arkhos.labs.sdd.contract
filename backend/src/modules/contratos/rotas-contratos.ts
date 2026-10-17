import { Router, type Request } from 'express';
import { ErroApp } from '../../http/erros.js';
import { receberPdf } from '../../http/upload.js';
import { validar } from '../../http/validar.js';
import {
  esquemaContrato,
  esquemaListagemContratos,
  type ConsultaContratos,
} from './esquemas-contratos.js';
import {
  buscarContrato,
  criarContrato,
  editarContrato,
  excluirContrato,
  listarContratos,
  localizarArquivo,
} from './servico-contratos.js';

/** Rotas de /api/contratos. A sessão é exigida pelo app, antes de montar este router. */
export const rotasContratos = Router();

/** Content-Disposition inline; nome fora do ASCII seguro vai também em filename* (RFC 5987). */
function disposicaoInline(nome: string): string {
  const limpo = nome.replace(/[\u0000-\u001f\u007f]/g, '');
  const ascii = limpo.replace(/["\\]/g, '_').replace(/[^\x20-\x7e]/g, '_');
  if (ascii === limpo) return `inline; filename="${ascii}"`;
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(limpo)}`;
}

/** Campos de texto do multipart. Sem multipart, o Express 5 deixa `req.body` indefinido: vira 400 claro. */
function camposDoFormulario(req: Request): unknown {
  if (typeof req.body !== 'object' || req.body === null) {
    throw new ErroApp(400, 'VALIDACAO_INVALIDA', 'O corpo da requisição não é um formulário válido.');
  }
  return req.body;
}

rotasContratos.get('/', validar({ consulta: esquemaListagemContratos }), async (_req, res, next) => {
  try {
    res.json(await listarContratos(res.locals.consulta as ConsultaContratos));
  } catch (erro) {
    next(erro);
  }
});

rotasContratos.post(
  '/',
  receberPdf({ obrigatorio: true }, async (req, arquivo) => {
    const dados = esquemaContrato.parse(camposDoFormulario(req));
    return { status: 201, corpo: await criarContrato(dados, arquivo!) };
  }),
);

rotasContratos.get('/:id', async (req, res, next) => {
  try {
    res.json(await buscarContrato(req.params.id));
  } catch (erro) {
    next(erro);
  }
});

rotasContratos.put(
  '/:id',
  receberPdf({ obrigatorio: false }, async (req, arquivo) => {
    const dados = esquemaContrato.parse(camposDoFormulario(req));
    return { status: 200, corpo: await editarContrato(String(req.params.id), dados, arquivo) };
  }),
);

rotasContratos.delete('/:id', async (req, res, next) => {
  try {
    await excluirContrato(req.params.id);
    res.status(204).end();
  } catch (erro) {
    next(erro);
  }
});

rotasContratos.get('/:id/arquivo', async (req, res, next) => {
  try {
    const { caminho, nomeOriginal } = await localizarArquivo(req.params.id);
    res.type('application/pdf');
    res.setHeader('Content-Disposition', disposicaoInline(nomeOriginal));
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(caminho, { dotfiles: 'allow' }, (erro) => {
      if (!erro) return;
      if (res.headersSent) {
        res.destroy();
        return;
      }
      res.removeHeader('Content-Disposition');
      res.removeHeader('Cache-Control');
      res.removeHeader('X-Content-Type-Options');
      // Linha no banco sem o PDF no disco: para o cliente, o arquivo não existe.
      next(
        (erro as { code?: string }).code === 'ENOENT'
          ? new ErroApp(404, 'NAO_ENCONTRADO', 'Arquivo do contrato não encontrado.')
          : erro,
      );
    });
  } catch (erro) {
    next(erro);
  }
});
