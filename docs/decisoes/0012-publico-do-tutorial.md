# 0012 — O tutorial é para sêniores que já usam IA (em vibe coding)

- **Data:** 2026-10-19
- **Status:** aceita

## Contexto

O `CLAUDE.md` define o público do projeto como "devs que ainda não usam IA para programar, mas
querem conhecer SDD". Quando fomos desenhar o tutorial de verdade, o autor deixou claro que o
leitor que ele quer alcançar é outro: **programadores sêniores que já usam IA no dia a dia, mas em
vibe coding** (prompt solto, sem spec), ou que querem entender SDD na prática.

## Opções consideradas

1. **Manter o público do `CLAUDE.md`** — o tutorial explicaria o que é prompt, contexto e agente.
   Perderia o sênior, que já sabe tudo isso e abandona no primeiro parágrafo.
2. **Mudar o público do tutorial e manter o diário como está** — o diário segue como registro
   bruto do laboratório; só o tutorial muda de público.

## Decisão

Opção 2. O tutorial 1 **não explica IA** (prompt, contexto, agente, token) e **explica cada termo
do SDD** na primeira vez que aparece. O tom continua informal e direto, em primeira pessoa.

## Consequências

- O texto dos capítulos é uma adaptação do diário, não uma cópia.
- O diário e as regras de escrita do `CLAUDE.md` seguem valendo para o laboratório.
- Os próximos tutoriais da série decidem o próprio público; se divergirem, ganham um ADR.
