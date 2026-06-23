[![GitHub release](https://img.shields.io/github/v/release/lepidus/selectionOfReviewingInterests)](https://github.com/lepidus/selectionOfReviewingInterests/releases)
[![License type](https://img.shields.io/github/license/lepidus/selectionOfReviewingInterests)](https://github.com/lepidus/selectionOfReviewingInterests/blob/main/LICENSE)
[![Number of downloads](https://img.shields.io/github/downloads/lepidus/selectionOfReviewingInterests/total)](https://github.com/lepidus/selectionOfReviewingInterests/releases)

[English](/README.md) | **Português Brasileiro** | [Español](/docs/README-es.md)

# Áreas de interesse predefinidas

Este plugin substitui o campo de áreas de interesse de avaliação por uma **lista predefinida de opções**.

![Demonstração do plugin: definindo as opções e um avaliador selecionando-as](predefinedReviewingInterestsDemo.gif)

## O que o plugin faz

- **O editor define as áreas de interesse possíveis.** Nas configurações do plugin, o editor cria a lista de áreas de interesse de avaliação que ficará disponível na revista (por exemplo: _Saúde Pública_, _Aprendizado de Máquina_, _História Medieval_).
- **Os avaliadores selecionam em vez de digitar.** Na página de perfil do usuário, o campo de áreas de interesse se torna um campo de múltipla seleção. Os avaliadores podem escolher uma ou mais opções, mas apenas a partir da sua lista predefinida.
- **Os avaliadores são incentivados a preencher o campo.** Um avaliador que não tenha nenhuma área de interesse selecionada é automaticamente redirecionado para a sua página de perfil ao tentar acessar o painel de controle, com uma mensagem explicando que ele precisa selecionar ao menos uma área de interesse antes de continuar.
- **O campo de áreas de interesse fica oculto durante o cadastro.** Para manter o formulário público de cadastro simples, o campo de texto livre de áreas de interesse de avaliação é removido da página de cadastro. Os avaliadores preenchem suas áreas de interesse depois, a partir da lista predefinida, no seu perfil.
- **Os editores podem filtrar avaliadores por área de interesse.** Ao selecionar um avaliador para uma submissão, os editores têm a opção "Filtrar por áreas de interesse" no painel de avaliadores, podendo rapidamente reduzir a lista aos avaliadores com a especialidade relevante.

> **Observação:** O plugin só entra em vigor depois que você configurar ao menos uma opção de área de interesse. Até lá, o OJS mantém o comportamento padrão do campo.

> **Observação:** As áreas de interesse de avaliação preenchidas antes da ativação do plugin permanecem registradas e continuam sendo exibidas no campo de áreas de interesse. Com o plugin ativado e configurado, os avaliadores só podem adicionar áreas a partir da lista predefinida, mas as que já haviam registrado anteriormente são mantidas (podendo ainda ser removidas).

## Compatibilidade

Este plugin é compatível com o OJS nas seguintes versões:

- 3.3.0.x (v1)
- 3.4.0.x (v2)
- 3.5.0.x (v3)

## Instalação

Acesse *Configurações -> Website -> Plugins -> Galeria de Plugins*. Clique em **Áreas de interesse predefinidas** e depois clique em *Instalar*.

## Como usar

1. Acesse `Configurações` > `Website` > `Plugins`, encontre **Áreas de interesse predefinidas** e ative-o.
2. Abra as configurações do plugin e adicione as opções de área de interesse que você deseja oferecer na sua revista.
3. Pronto — os avaliadores passarão a selecionar suas áreas de interesse a partir da sua lista, e os editores poderão filtrá-los por área de interesse.

## Licença

Este plugin é licenciado sob a GNU General Public License v3.0

_Copyright (c) 2025-2026 Lepidus Tecnologia_
