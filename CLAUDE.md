# CLAUDE.md

Deck da **reunião do CONSAD de 11/11/2026, às 10h** (Investe Maranhão e ZPE Maranhão), para deliberar o Contrato de Reserva Onerosa de Área de 460 ha com a LN Partners Ltda., proponente do projeto Hydeas (Hydrogen Decarbonization Alliance Steel). Quem apresenta é a presidente da ZPE, Rakel Murad. O ofício de convocação não veio: número e tipo da reunião, item da pauta e formato (on-line ou presencial) ainda não constam no deck.

Feito com a skill `zpe-apresentacoes`, a partir do modelo do Consad de outubro/2026 (que herda o template `slides/deck-relatorio` da `zpe-design-system`). Valem o palco fixo 1920×1080 escalado pela largura, a zona segura `150px 168px 190px`, o grão em toda superfície e só o vídeo da capa com autoplay. HTML, CSS e JS inline em `index.html`; os componentes deste deck ficam no fim do CSS, no bloco "CONSAD DE NOVEMBRO · PROJETO HYDEAS". As barras de receita vêm do deck `2026-11_apresentacao-estimativa-receitas`, com as mesmas cores.

Os assets de deck (vídeos, mapa, logos) foram copiados do deck de outubro, porque a `zpe-design-system` local não existe neste PC.

## Estrutura (pedida pela presidente)

1. Resumo dos números e características do projeto: slides 3 e 4.
2. Resumo da minuta da reserva: slides 5 e 6. **Só o quadro 3 do parecer** (pedido da presidência); as seções 5 e 6 (análise econômica, cenários com CDRU, aderência ao Business Plan e riscos) ficaram de fora de propósito.
3. Planta da ZPE com a Hydeas e a NexSolar: slide 7.
4. Projeção das receitas para a ZPE: slides 8 e 9.

Capa, pauta (com selo único de deliberação) e encerramento com cinco números completam os 10 slides.

## Dados

- **Fonte única no script:** `PROJETO` (pptx dos 4 projetos e `informacoes_extras_hydeas.md`), `RESERVA` (quadro 3 do parecer) e `RECEITAS` (planilha, em reais, sem arredondar). Os slides contam por `data-conta`; as barras dos slides 8 e 9 e a divisão de empregos (`data-flex`) são montadas dali. Mudou um número, muda só lá.
- **Conferência automática:** a reserva da planilha (R$ 4,8 mi) tem de ser igual a `parcela × parcelas` do contrato; se não for, o console avisa e o `verificar` falha.
- **Projeto:** R$ 18,464 bi (10,972 + 7,492), 460 ha (230 por fase), 1,35 e 2,70 milhões de t/ano de HBI, empregos 7.284 + 10.949 = 18.233 na implantação e 300 + 4.410 = 4.710 na operação, operação plena em 2033 e 2036. Carteira de R$ 28,82 bi dos 4 projetos (pptx).
- **Aprovação no CZPE:** Resolução CZPE/MDIC nº 126, de 25/08/2026, DOU de 01/09/2026 (fonte: `2026-10_zpe-video-grafico/data/processed/fontes_czpe_geografia.md`).
- **Minuta:** texto do quadro 3 do `Parecer_Diretoria_Executiva_LN_Partners_final_assinado_assinado_assinado.pdf` (5/11/2026), com o item da minuta ao lado de cada condição.
- **Planta:** `fontes/planta.jpeg` em `assets/fotos/zpe-planta-hydeas-h2x.jpg`; as cores da legenda foram amostradas da própria planta. NexSolar: CDRU do lote LT-ZPE-001, 60 ha, assinada em 16/10/2026 (deck de outubro).
- **Receitas:** `fontes/Estimativa de receitas da zpe_corrigido.xlsx`. Hydeas: serviços R$ 419,5 mi + reserva R$ 4,8 mi = R$ 424,3 mi em 20 anos (26,8% de R$ 1.585,4 mi). A CDRU da Hydeas e da Oil Group não entrou na planilha; valores sem reajuste. "Serviços" ficou genérico, como no deck da estimativa.
- **Nomes:** matéria do conselho, então as empresas aparecem pelo nome. "Hyfarm", citado pelo Fred, não aparece em nenhum documento; fica fora até confirmação.
- **Marca do Governo:** ligada (`MOSTRAR_MARCA_GOVERNO = true`), como nos decks de novembro, depois do período eleitoral.

## Comandos

```
npm install
npm run verificar             # 5 janelas: texto cortado, console, 404 (SHOTS=1 grava .shots/)
npm run pdf -- NOME-v1.pdf    # uma página 16:9 por slide
```
