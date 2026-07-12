---
title: Markdown Example
published: 2023-10-01
description: A simple example of a Markdown blog post.
tags: [Markdown, Blogging, Demo]
category: Examples
draft: false
---

# An h1 header 一级标题

Paragraphs are separated by a blank line.

段落之间用空行分隔。

2nd paragraph. _Italic_, **bold**, and `monospace`. Itemized lists
look like:

第二段。_斜体_、**粗体**，以及 `等宽字体`。无序列表
长这样：

- this one
- that one
- the other one

- 这个
- 那个
- 另一个

Note that --- not considering the asterisk --- the actual text
content starts at 4-columns in.

注意——先不考虑星号——实际的正文内容从第 4 列开始。

> Block quotes are
> written like so.
>
> They can span multiple paragraphs,
> if you like.

> 引用块是
> 这样写的。
>
> 如果你愿意，
> 它们可以跨越多个段落。

Use 3 dashes for an em-dash. Use 2 dashes for ranges (ex., "it's all
in chapters 12--14"). Three dots ... will be converted to an ellipsis.
Unicode is supported. ☺

用 3 个连字符表示破折号。用 2 个连字符表示范围（例如，“这些内容全在第 12--14 章”）。三个点 ... 会被转换为省略号。支持 Unicode 字符。☺

## An h2 header 二级标题

Here's a numbered list:

这是一个有序列表：

1. first item
2. second item
3. third item

1. 第一项
2. 第二项
3. 第三项

Note again how the actual text starts at 4 columns in (4 characters
from the left side). Here's a code sample:

再次注意实际的正文是如何从第 4 列开始的（也就是从左侧
数第 4 个字符）。下面是一个代码示例：

    # Let me re-iterate ...
    for i in 1 .. 10 { do-something(i) }

    # 让我再重申一遍 ...
    for i in 1 .. 10 { do-something(i) }

As you probably guessed, indented 4 spaces. By the way, instead of
indenting the block, you can use delimited blocks, if you like:

你可能猜到了，缩进 4 个空格。顺便说一下，你不必整块缩进，如果愿意，
也可以使用分隔标记的代码块：

```
define foobar() {
    print "Welcome to flavor country!";
}
```

```
define foobar() {
    print "Welcome to flavor country!";
}
```

(which makes copying & pasting easier). You can optionally mark the
delimited block for Pandoc to syntax highlight it:

（这让复制和粘贴更方便）。你也可以为分隔标记的代码块指定语言，
让 Pandoc 进行语法高亮：

```python
import time
# Quick, count to ten!
for i in range(10):
    # (but not *too* quick)
    time.sleep(0.5)
    print i
```

```python
import time
# 快点，数到十！
for i in range(10):
    # （但也不要*太*快）
    time.sleep(0.5)
    print i
```

### An h3 header 三级标题

Now a nested list:

现在来看一个嵌套列表：

1. First, get these ingredients:

1. 首先，准备好这些食材：

    - carrots
    - celery
    - lentils

    - 胡萝卜
    - 芹菜
    - 扁豆

2. Boil some water.

2. 烧一些开水。

3. Dump everything in the pot and follow
    this algorithm:

3. 把所有东西倒进锅里，然后
    按照下面的步骤操作：

        find wooden spoon
        uncover pot
        stir
        cover pot
        balance wooden spoon precariously on pot handle
        wait 10 minutes
        goto first step (or shut off burner when done)

        找到木勺
        打开锅盖
        搅拌
        盖上锅盖
        把木勺摇摇欲坠地搭在锅把上
        等待 10 分钟
        回到第一步（或完成后关火）

    Do not bump wooden spoon or it will fall.

    别碰到木勺，否则它会被碰掉。

Notice again how text always lines up on 4-space indents (including
that last line which continues item 3 above).

再次注意正文总是对齐在 4 个空格的缩进上（包括上面延续第 3 项的
最后一行也是如此）。

Here's a link to [a website](http://foo.bar), to a [local
doc](local-doc.html), and to a [section heading in the current
doc](#an-h2-header). Here's a footnote [^1].

这里有一个指向 [某个网站](http://foo.bar) 的链接，一个指向 [本地
文档](local-doc.html) 的链接，以及一个指向 [当前文档中的某个
章节标题](#an-h2-header) 的链接。这里还有一个脚注 [^1]。

[^1]: Footnote text goes here.

[^1]: 脚注内容写在这里。

Tables can look like this:

表格可以长这样：

size material color

尺寸 材质 颜色

---

---

9 leather brown
10 hemp canvas natural
11 glass transparent

9 皮革 棕色
10 麻布帆布 原色
11 玻璃 透明

Table: Shoes, their sizes, and what they're made of

表：鞋子、它们的尺码，以及制作材料

(The above is the caption for the table.) Pandoc also supports
multi-line tables:

（上面这行是表格的标题。）Pandoc 也支持
多行表格：

---

---

keyword text

关键词 文本

---

---

red Sunsets, apples, and
other red or reddish
things.

红色 日落、苹果，
以及其他红色或泛红的
事物。

green Leaves, grass, frogs
and other things it's
not easy being.

绿色 树叶、青草、青蛙，
以及其他那些
不容易成为的事物。

---

---

A horizontal rule follows.

接下来是一条分隔线。

---

---

Here's a definition list:

这是一个定义列表：

apples
: Good for making applesauce.
oranges
: Citrus!
tomatoes
: There's no "e" in tomatoe.

苹果
: 适合做苹果酱。
橙子
: 柑橘类！
西红柿
: tomatoe 里没有 "e"。

Again, text is indented 4 spaces. (Put a blank line between each
term/definition pair to spread things out more.)

再次提醒，正文缩进 4 个空格。（在每个术语和定义之间加一个空行，
可以让内容排列得更稀疏。）

Here's a "line block":

这是一个“行块”：

| Line one
| Line too
| Line tree

| 第一行
| 第二行（too 谐音“二”）
| 第三行（tree 谐音“三”）

and images can be specified like so:

图片可以这样指定：

[//]: # (![example image]&#40;./demo-banner.png "An exemplary image"&#41;)

[//]: # (![example image]&#40;./demo-banner.png "An exemplary image"&#41;)

Inline math equations go in like so: $\omega = d\phi / dt$. Display
math should get its own line and be put in in double-dollarsigns:

行内数学公式这样写：$\omega = d\phi / dt$。而需要单独成行的
展示型数学公式，应当用双美元符号包裹：

$$I = \int \rho R^{2} dV$$

$$I = \int \rho R^{2} dV$$

$$
\begin{equation*}
\pi
=3.1415926535
 \;8979323846\;2643383279\;5028841971\;6939937510\;5820974944
 \;5923078164\;0628620899\;8628034825\;3421170679\;\ldots
\end{equation*}
$$

$$
\begin{equation*}
\pi
=3.1415926535
 \;8979323846\;2643383279\;5028841971\;6939937510\;5820974944
 \;5923078164\;0628620899\;8628034825\;3421170679\;\ldots
\end{equation*}
$$

And note that you can backslash-escape any punctuation characters
which you wish to be displayed literally, ex.: \`foo\`, \*bar\*, etc.

最后请注意，如果你希望某些标点字符按字面原样显示，可以在它们前面加反斜杠转义，例如：\`foo\`、\*bar\* 等。