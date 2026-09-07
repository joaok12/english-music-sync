# 🇺🇸 USA English Travel Sync • Karaokê Musical

## Publicação

Este projeto é um site estático publicado na Vercel. A integração Supabase já
está preparada para a área de membros: o webhook da Hubla registra comprador,
CPF protegido por HMAC, produtos e status de acesso; o login confere e-mail +
CPF e abre uma biblioteca protegida. Consulte
[`SUPABASE_HUBLA_SETUP.md`](SUPABASE_HUBLA_SETUP.md) para cadastrar o token da
Hubla e associar os produtos às músicas.

As músicas públicas e o estúdio local continuam funcionando como antes. O
 catálogo protegido usa as tabelas `songs`, `products` e `product_songs` do
 Supabase; capas e áudios ficam no bucket privado `song-media` e só são
 entregues para quem tem um produto ativo. O painel administrativo em
 [`admin.html`](admin.html) permite cadastrar capa, áudio e letra, vincular
 produtos/order bumps e salvar a sincronização diretamente na nuvem.

Após o deploy, abra a URL da Vercel normalmente; não use os links `localhost` para compartilhar o app.

## Adicionar suas músicas

No karaokê, a engrenagem ao lado do player (ou a tecla **C**) abre **Configurações**. Há temas de alto contraste, incluindo **USA Claro** (fundo branco e texto escuro) e **USA Blur** (fundo branco com cabeçalho e rodapé escuros), além de Aurora, Oceano, Floresta, Âmbar e Original. Desative **Mostrar Inglês Cantando e preço** para exibir o nome da música no topo. Feche o painel antes de gravar; as escolhas valem apenas nesta página e voltam ao padrão ao recarregar.


Na página inicial ou no estúdio, clique em **Adicionar música**. Escolha um arquivo de áudio, dê um nome e cole a letra inteira. A cada três linhas não vazias, a página cria uma parte com português, inglês e repetição em inglês, nessa ordem. Linhas em branco são ignoradas; pontos finais e reticências são removidos; cada palavra fica pronta para marcar. Interrogações e apóstrofos são mantidos. Confira a prévia: se faltar uma linha para completar um grupo, o cadastro avisa antes de salvar.

Se uma letra foi cadastrada errada, use **✎ Editar letra** no cartão da música ou no estúdio. A música já abre preenchida; corrija o texto e salve. Para músicas adicionadas, o áudio é mantido sem precisar escolhê-lo de novo. Nas músicas do catálogo, a correção da letra fica salva no navegador para aquele título.

No estúdio, **📥 Importar JSON** aceita o arquivo de uma sincronização antiga. Escolha a música correspondente, importe o arquivo exportado e os tempos são aplicados imediatamente; não é preciso marcar as palavras novamente. O JSON precisa ter sido exportado depois de a sincronização estar completa.

Clique em **Salvar e começar a sincronizar**. No estúdio original, toque o áudio e pressione Espaço a cada palavra; depois da última, pressione novamente para marcar seu fim. O rascunho é salvo a cada marcação e a sincronização completa é aplicada automaticamente ao karaokê. O botão **Salvar no Karaokê** também continua disponível.

O áudio e as músicas adicionadas ficam no IndexedDB deste navegador, no mesmo endereço do site. A versão atual usa `http://localhost:3334`; links antigos da porta `3333` são redirecionados automaticamente. Não é necessário selecionar o áudio novamente ao voltar. Limpar os dados do site apaga essa biblioteca: mantenha o arquivo de áudio e baixe o JSON como cópia. A preparação da letra é automática; os tempos são marcados por você ao ouvir a música.

Site interativo de aprendizado de inglês com sincronização de letra em tempo real estilo Karaokê, especialmente desenvolvido com a identidade visual dos Estados Unidos (azul marinho profundo, vermelho vivo, branco cristalino e estrelas).

---

## 🚀 Como Abrir e Usar

1. **Método 1 (Mais fácil - 2 cliques no Mac):**
   - Dê um duplo clique no arquivo `abrir_karaoke.command`.
   - O navegador padrão abrirá automaticamente com o karaokê pronto.

2. **Método 2 (Terminal):**
   ```bash
   cd "/Users/admin/orca/projects/ENGLISH MUSIC SYNC letra"
   python3 -m http.server 3334
   ```
   E abra no seu navegador: `http://localhost:3334`

---

## ✨ Recursos Implementados

- **Sincronização Perfeita (60 FPS):** Acompanhamento fluido da voz através de `requestAnimationFrame`, destacando automaticamente a frase ativa e exibindo uma barra de progresso individual (*karaoke wipe*).
- **Estrutura de Linhas Separadas:**
  - Linha 1: Português (`PT 🇧🇷`)
  - Quebra de linha
  - Linha 2: Inglês (`EN 🇺🇸`) com destaque karaokê
- **Clique para Cantar:** Clique em qualquer frase da lista para o áudio saltar instantaneamente para ela.
- **Auto-Scroll Inteligente:** Mantém a frase atual sempre visível no centro da tela conforme a música avança.
- **Modo Loop de Frase (🔁):** Repete continuamente a frase atual para você praticar a pronúncia até dominar.
- **Modo Treino (👁️):** Oculta a tradução em português para você testar sua memória antes de ouvir a frase em inglês.
- **Controle de Velocidade (⚡):** Alterne entre 1.0x, 1.25x e 0.75x (ótimo para treinar frases mais rápidas).
- **Ajuste Fino de Sincronia:** Botões de `+0.1s` e `-0.1s` para calibrar o tempo ao seu gosto.
- **Atalhos do Teclado:**
  - `Espaço`: Play / Pause
  - `Seta Esquerda (←)`: Voltar 5 segundos
  - `Seta Direita (→)`: Avançar 5 segundos

---

## 🎵 Frases Incluídas na Canção

1. **Intro:** Vamos aprender frases úteis para viagens. Preparado? Vamos lá! *(Let's learn some useful phrases. Ready? Let's go!)*
2. **Eu quero** *(I want)*
3. **Eu preciso de ajuda** *(I need help)*
4. **Quanto custa?** *(How much is it?)*
5. **Aqui está meu passaporte** *(Here is my passport)*
6. **Pode me ajudar?** *(Can you help me?)*
7. **Onde fica o banheiro?** *(Where is the bathroom?)*
8. **Onde é meu portão?** *(Where is my gate?)*
9. **Qual é o meu assento?** *(What is my seat?)*
10. **Onde está a minha mala?** *(Where is my bag?)*
11. **Aqui está meu passaporte** *(Here is my passport - Revisão)*
12. **Pode me ajudar?** *(Can you help me? - Revisão)*
13. **Onde fica o banheiro?** *(Where is the bathroom? - Revisão)*
14. **Eu não entendo** *(I don't understand)*
15. **Pode repetir?** *(Can you repeat?)*
16. **Mais devagar, por favor** *(Slower, please)*
17. **Outro:** Muito bem! Até a próxima vez! *(Very good! See you next time!)*
