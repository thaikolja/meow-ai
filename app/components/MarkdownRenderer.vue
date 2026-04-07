<!--
  - Copyright (C) 2026 Kolja Nolte
  - https://meow.yanawa.io
  - info@meow.yanawa.io
  -
  - This work is licensed under the MIT License. You are free to use, modify,
  - and distribute this work, provided that you include the copyright notice
  - and this permission notice in all copies or substantial portions of the work.
  - For more information, visit: https://opensource.org/licenses/MIT
  -
  - @author    Kolja Nolte
  - @email     kolja.nolte@gmail.com
  - @license   MIT
  - @date      2026
  - @website   https://meow.yanawa.io
  -->

<template>
  <div v-html="renderedHtml" />
</template>

<script lang="ts" setup>
  /**
   * A robust Markdown renderer that converts raw strings into sanitized HTML.
   * Includes built-in syntax highlighting via Highlight.js for a wide variety of programming languages.
   */

  import { marked }   from 'marked'
  import sanitizeHtml from 'sanitize-html'
  import hljs         from 'highlight.js/lib/core'
  import javascript   from 'highlight.js/lib/languages/javascript'
  import typescript   from 'highlight.js/lib/languages/typescript'
  import python       from 'highlight.js/lib/languages/python'
  import bash         from 'highlight.js/lib/languages/bash'
  import json         from 'highlight.js/lib/languages/json'
  import css          from 'highlight.js/lib/languages/css'
  import xml          from 'highlight.js/lib/languages/xml'
  import sql          from 'highlight.js/lib/languages/sql'
  import markdown     from 'highlight.js/lib/languages/markdown'
  import yaml         from 'highlight.js/lib/languages/yaml'
  import go           from 'highlight.js/lib/languages/go'
  import rust         from 'highlight.js/lib/languages/rust'
  import java         from 'highlight.js/lib/languages/java'
  import php          from 'highlight.js/lib/languages/php'
  import csharp       from 'highlight.js/lib/languages/csharp'

  // Register all supported highlight.js languages for server-side or client-side rendering
  hljs.registerLanguage('javascript', javascript)
  hljs.registerLanguage('js', javascript)
  hljs.registerLanguage('typescript', typescript)
  hljs.registerLanguage('ts', typescript)
  hljs.registerLanguage('python', python)
  hljs.registerLanguage('bash', bash)
  hljs.registerLanguage('sh', bash)
  hljs.registerLanguage('shell', bash)
  hljs.registerLanguage('json', json)
  hljs.registerLanguage('css', css)
  hljs.registerLanguage('html', xml)
  hljs.registerLanguage('xml', xml)
  hljs.registerLanguage('sql', sql)
  hljs.registerLanguage('markdown', markdown)
  hljs.registerLanguage('md', markdown)
  hljs.registerLanguage('yaml', yaml)
  hljs.registerLanguage('yml', yaml)
  hljs.registerLanguage('go', go)
  hljs.registerLanguage('rust', rust)
  hljs.registerLanguage('java', java)
  hljs.registerLanguage('php', php)
  hljs.registerLanguage('csharp', csharp)
  hljs.registerLanguage('cs', csharp)

  const props = defineProps<{
    /** Raw markdown content string to be parsed */
    content: string
  }>()

  // Configure the marked library for GitHub Flavored Markdown (GFM)
  const renderer = new marked.Renderer()

  /**
   * Custom code block renderer.
   * Wraps code blocks in a styled container with a 'Copy' button and syntax highlighting.
   */
  renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
    const language = lang && hljs.getLanguage(lang) ? lang: 'plaintext'
    let highlighted: string
    try {
      highlighted = language!=='plaintext'
          ? hljs.highlight(text, { language }).value
          : escapeHtml(text)
    } catch {
      highlighted = escapeHtml(text)
    }

    return `<div class="relative group my-3 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
    <div class="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700/50">
      <span class="text-xs text-neutral-600 dark:text-neutral-400 font-mono">${language}</span>
    </div>
    <pre class="!mt-0 !rounded-none bg-neutral-50 dark:bg-neutral-900 overflow-x-auto p-4"><code class="text-sm leading-relaxed hljs language-${language}">${highlighted}</code></pre>
  </div>`
  }

  renderer.link = function ({ href, title, tokens }) {
    const text      = this.parser.parseInline(tokens)
    const safeHref  = href && /^(https?:|mailto:|tel:)/i.test(href) ? href: '#'
    const titleAttr = title ? ` title="${escapeHtml(title)}"`: ''

    return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer nofollow"${titleAttr}>${text}</a>`
  }

  /**
   * Sanitary helper to escape HTML characters from raw strings.
   * Prevents XSS when rendering plaintext content within code blocks.
   */
  function escapeHtml(text: string): string {
    return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
  }

  // Global marked library options
  marked.setOptions({
    renderer,
    gfm:    true,
    breaks: true // Interprets single line breaks as <br>
  })

  /**
   * Computed property that returns the final sanitized HTML string.
   * Automatically recalculates when props.content changes.
   */
  const renderedHtml = computed(() => {
    if (!props.content) return ''
    try {
      return sanitizeHtml(marked.parse(props.content) as string, {
        allowedTags:           [
          'a', 'blockquote', 'br', 'code', 'del', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'hr', 'li', 'ol', 'p', 'pre', 'span', 'strong', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul'
        ],
        allowedAttributes:     {
          a:    [ 'href', 'target', 'rel', 'title' ],
          code: [ 'class' ],
          div:  [ 'class' ],
          pre:  [ 'class' ],
          span: [ 'class' ],
          th:   [ 'colspan', 'rowspan' ],
          td:   [ 'colspan', 'rowspan' ]
        },
        allowedSchemes:        [ 'http', 'https', 'mailto', 'tel' ],
        allowProtocolRelative: false
      })
    } catch {
      // If parsing fails for any reason, return the raw content to prevent total UI failure
      return escapeHtml(props.content)
    }
  })
</script>
