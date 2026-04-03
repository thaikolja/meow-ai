<template>
  <div v-html="renderedHtml" />
</template>

<script setup lang="ts">
import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import sql from 'highlight.js/lib/languages/sql'
import markdown from 'highlight.js/lib/languages/markdown'
import yaml from 'highlight.js/lib/languages/yaml'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import java from 'highlight.js/lib/languages/java'
import php from 'highlight.js/lib/languages/php'
import csharp from 'highlight.js/lib/languages/csharp'

// Register languages
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
  content: string
}>()

// Configure marked
const renderer = new marked.Renderer()

renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  let highlighted: string
  try {
    highlighted = language !== 'plaintext'
      ? hljs.highlight(text, { language }).value
      : escapeHtml(text)
  } catch {
    highlighted = escapeHtml(text)
  }

  return `<div class="relative group my-3 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
    <div class="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700/50">
      <span class="text-xs text-neutral-600 dark:text-neutral-400 font-mono">${language}</span>
      <button onclick="navigator.clipboard.writeText(this.closest('.group').querySelector('code').textContent).then(()=>{this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',2000)})" class="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors px-2 py-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700">Copy</button>
    </div>
    <pre class="!mt-0 !rounded-none bg-neutral-50 dark:bg-neutral-900 overflow-x-auto p-4"><code class="text-sm leading-relaxed hljs language-${language}">${highlighted}</code></pre>
  </div>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

marked.setOptions({
  renderer,
  gfm: true,
  breaks: true
})

const renderedHtml = computed(() => {
  if (!props.content) return ''
  try {
    return marked.parse(props.content) as string
  } catch {
    return props.content
  }
})
</script>
