---
title: Markdown Extended Features
published: 2024-05-01
updated: 2024-11-29
description: 'Read more about Markdown features in Fuwari'
image: ''
tags: [Demo, Example, Markdown, Fuwari]
category: 'Examples'
draft: false 
---

## GitHub Repository Cards GitHub 仓库卡片

You can add dynamic cards that link to GitHub repositories, on page load, the repository information is pulled from the GitHub API.

你可以添加链接到 GitHub 仓库的动态卡片，页面加载时会从 GitHub API 拉取仓库信息。

::github{repo="Fabrizz/MMM-OnSpotify"}

Create a GitHub repository card with the code `::github{repo="<owner>/<repo>"}`.

使用代码 `::github{repo="<owner>/<repo>"}` 即可创建一个 GitHub 仓库卡片。

```markdown
::github{repo="saicaca/fuwari"}
```

## Admonitions 提示框

Following types of admonitions are supported: `note` `tip` `important` `warning` `caution`

支持以下类型的提示框：`note` `tip` `important` `warning` `caution`

:::note
Highlights information that users should take into account, even when skimming.
:::

:::note
用于强调用户应当留意的信息，即便只是快速浏览也应注意。
:::

:::tip
Optional information to help a user be more successful.
:::

:::tip
为用户提供可选的辅助信息，帮助其更好地完成任务。
:::

:::important
Crucial information necessary for users to succeed.
:::

:::important
向用户传达达成目标所必需的关键信息。
:::

:::warning
Critical content demanding immediate user attention due to potential risks.
:::

:::warning
提示存在潜在风险的关键内容，需要用户立即关注。
:::

:::caution
Negative potential consequences of an action.
:::

:::caution
提醒某项操作可能带来的负面后果。
:::

### Basic Syntax 基础语法

```markdown
:::note
Highlights information that users should take into account, even when skimming.
:::

:::tip
Optional information to help a user be more successful.
:::
```

### Custom Titles 自定义标题

The title of the admonition can be customized.

提示框的标题可以自定义。

:::note[MY CUSTOM TITLE]
This is a note with a custom title.
:::

:::note[MY CUSTOM TITLE]
这是一个带有自定义标题的 note 提示框。
:::

```markdown
:::note[MY CUSTOM TITLE]
This is a note with a custom title.
:::
```

### GitHub Syntax GitHub 语法

> [!TIP]
> [The GitHub syntax](https://github.com/orgs/community/discussions/16925) is also supported.

> [!TIP]
> 也支持 [GitHub 语法](https://github.com/orgs/community/discussions/16925)。

```
> [!NOTE]
> The GitHub syntax is also supported.

> [!TIP]
> The GitHub syntax is also supported.
```

### Spoiler 剧透折叠

You can add spoilers to your text. The text also supports **Markdown** syntax.

你可以为文本添加剧透折叠，其中的文本同样支持 **Markdown** 语法。

The content :spoiler[is hidden **ayyy**]!

内容 :spoiler[被隐藏了 **ayyy**]！

```markdown
The content :spoiler[is hidden **ayyy**]!

```