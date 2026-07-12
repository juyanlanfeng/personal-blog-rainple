---
title: Simple Guides for Fuwari
published: 2024-04-01
description: "How to use this blog template."
image: "./cover.jpeg"
tags: ["Fuwari", "Blogging", "Customization"]
category: Guides
draft: false
---

> Cover image source: [Source](https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/208fc754-890d-4adb-9753-2c963332675d/width=2048/01651-1456859105-(colour_1.5),girl,_Blue,yellow,green,cyan,purple,red,pink,_best,8k,UHD,masterpiece,male%20focus,%201boy,gloves,%20ponytail,%20long%20hair,.jpeg)

> 封面图来源：[来源](https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/208fc754-890d-4adb-9753-2c963332675d/width=2048/01651-1456859105-(colour_1.5),girl,_Blue,yellow,green,cyan,purple,red,pink,_best,8k,UHD,masterpiece,male%20focus,%201boy,gloves,%20ponytail,%20long%20hair,.jpeg)

This blog template is built with [Astro](https://astro.build/). For the things that are not mentioned in this guide, you may find the answers in the [Astro Docs](https://docs.astro.build/).

本博客模板基于 [Astro](https://astro.build/) 构建。对于本指南中未提及的内容，你可以在 [Astro 文档](https://docs.astro.build/) 中找到答案。

## Front-matter of Posts

## 文章的 Front-matter

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg
tags: [Foo, Bar]
category: Front-end
draft: false
---
```

| Attribute     | Description                                                                                                                                                                                                 |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `title`       | The title of the post.                                                                                                                                                                                      |
| `published`   | The date the post was published.                                                                                                                                                                            |
| `description` | A short description of the post. Displayed on index page.                                                                                                                                                   |
| `image`       | The cover image path of the post.<br/>1. Start with `http://` or `https://`: Use web image<br/>2. Start with `/`: For image in `public` dir<br/>3. With none of the prefixes: Relative to the markdown file |
| `tags`        | The tags of the post.                                                                                                                                                                                       |
| `category`    | The category of the post.                                                                                                                                                                                   |
| `draft`        | If this post is still a draft, which won't be displayed.                                                                                                                                                    |

| 字段          | 说明                                                                                                                                                                                                                                             |
|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `title`       | 文章标题。                                                                                                                                                                                                                                          |
| `published`   | 文章发布日期。                                                                                                                                                                                                                                      |
| `description` | 文章的简短描述，显示在索引页上。                                                                                                                                                                                                                   |
| `image`       | 文章封面图路径。<br/>1. 以 `http://` 或 `https://` 开头：使用网络图片<br/>2. 以 `/` 开头：用于 `public` 目录中的图片<br/>3. 不含上述前缀：相对于 Markdown 文件的路径                                                                                                                  |
| `tags`        | 文章的标签。                                                                                                                                                                                                                                      |
| `category`    | 文章的分类。                                                                                                                                                                                                                                      |
| `draft`       | 该文章是否仍为草稿，草稿不会被展示。                                                                                                                                                                                                               |

## Where to Place the Post Files

## 文章文件应放在哪里



Your post files should be placed in `src/content/posts/` directory. You can also create sub-directories to better organize your posts and assets.

你的文章文件应放在 `src/content/posts/` 目录下。你也可以创建子目录，以便更好地组织文章和资源文件。

```
src/content/posts/
├── post-1.md
└── post-2/
    ├── cover.png
    └── index.md
```