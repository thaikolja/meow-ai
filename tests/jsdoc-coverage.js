/*
 * Copyright (C) 2026 Kolja Nolte
 * https://meow.yanawa.io
 * info@meow.yanawa.io
 *
 * This work is licensed under the MIT License. You are free to use, modify,
 * and distribute this work, provided that you include the copyright notice
 * and this permission notice in all copies or substantial portions of the work.
 * For more information, visit: https://opensource.org/licenses/MIT
 *
 * @author    Kolja Nolte
 * @license   MIT
 * @date      2026
 * @website   https://meow.yanawa.io
 */

/**
 * Finds project functions whose JSDoc is missing a summary, a `@param`, or a `@returns`.
 * Callbacks passed to other calls are not functions of the file. Assigned arrows, methods,
 * `function` declarations, and the arrow passed to a Nitro or Nuxt route wrapper are.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative }             from 'node:path'

const SKIP_DIRS = new Set([
    'node_modules', '.nuxt', '.nuxt-e2e', '.output', 'coverage', 'dist', '.git',
    'test-results', 'playwright-report'
])

const WORDS = new Set([
    'function', 'async', 'return', 'const', 'let', 'var', 'export', 'default',
    'if', 'else', 'for', 'while', 'switch', 'case', 'catch', 'try', 'throw',
    'new', 'typeof', 'instanceof', 'in', 'of', 'void', 'get', 'set', 'static',
    'public', 'private', 'protected', 'readonly', 'constructor', 'extends',
    'import', 'from', 'as', 'type', 'interface', 'enum', 'class', 'await',
    'break', 'continue', 'do', 'yield', 'delete', 'true', 'false', 'null',
    'undefined', 'this', 'super', 'with', 'abstract', 'declare', 'override'
])

const HANDLERS = new Set([
    'defineEventHandler', 'defineNuxtRouteMiddleware', 'defineNitroPlugin'
])

/**
 * Lists `.ts` and `.js` files under `root`, skipping dependencies and build output.
 *
 * @param root - Repository root.
 * @returns Absolute file paths.
 */
function listScripts(root) {
    const files = []

    /**
     * Adds script files from one directory.
     *
     * @param dir - Directory to walk.
     * @returns Nothing. Matches are pushed onto `files`.
     */
    function walk(dir) {
        for (const name of readdirSync(dir)) {
            if (name.startsWith('.') || SKIP_DIRS.has(name)) continue
            const path = join(dir, name)
            if (statSync(path).isDirectory()) {
                walk(path)
                continue
            }
            if (extname(name)==='.ts' || extname(name)==='.js') files.push(path)
        }
    }

    walk(root)
    return files
}

/**
 * Splits source into tokens. Strings, templates, comments, and regular expressions stay intact.
 *
 * @param source - File text.
 * @returns Tokens in source order.
 */
function tokenize(source) {
    const tokens = []
    let i        = 0
    const n      = source.length

    /**
     * Stores one token.
     *
     * @param kind - Token kind.
     * @param start - Start index in `source`.
     * @param end - End index in `source`.
     * @param text - Token spelling, when the kind needs it.
     * @returns Nothing.
     */
    function push(kind, start, end, text) {
        const token = text===undefined ? { kind, start, end }: { kind, start, end, text }
        tokens.push(token)
    }

    /**
     * The previous code token, ignoring comments.
     *
     * @returns That token, or `null` at the start of the file.
     */
    function previousCode() {
        for (let index = tokens.length - 1; index >= 0; index--) {
            if (tokens[index].kind!=='line' && tokens[index].kind!=='block') return tokens[index]
        }
        return null
    }

    /**
     * Reads a regular-expression literal when `/` is not division.
     *
     * @returns Nothing. The regex token is pushed.
     */
    function scanRegex() {
        const start = i
        i++
        let inClass = false
        while (i < n) {
            if (source[i]==='\\') {
                i += 2
                continue
            }
            if (source[i]==='[') inClass = true
            else if (source[i]===']') inClass = false
            else if (source[i]==='/' && !inClass) {
                i++
                break
            }
            i++
        }
        while (i < n && /[dgimsuvy]/i.test(source[i])) i++
        push('regex', start, i)
    }

    /**
     * Reads one template literal, including `${...}` expressions.
     *
     * @returns Nothing. Template and expression tokens are pushed.
     */
    function scanTemplate() {
        let chunk = i
        i++
        while (i < n) {
            if (source[i]==='\\') {
                i += 2
                continue
            }
            if (source[i]==='`') {
                i++
                push('tmpl', chunk, i)
                return
            }
            if (source[i]==='$' && source[i + 1]==='{') {
                push('tmpl', chunk, i)
                push('punct', i, i + 2, '${')
                i += 2
                scanCode(true)
                if (source[i]==='}') {
                    push('punct', i, i + 1, '}')
                    i++
                }
                chunk = i
                continue
            }
            i++
        }
    }

    /**
     * Reads code until the file ends or an interpolation brace closes.
     *
     * @param stopOnInterpBrace - Stop before the `}` that closes `${...}`.
     * @returns Nothing. Tokens are pushed.
     */
    function scanCode(stopOnInterpBrace) {
        let brace   = 0
        let paren   = 0
        let bracket = 0
        while (i < n) {
            const c = source[i]
            if (stopOnInterpBrace && c==='}' && brace===0 && paren===0 && bracket===0) return
            if (c===' ' || c==='\t' || c==='\n' || c==='\r') {
                i++
                continue
            }
            if (c==='/' && source[i + 1]==='/') {
                const start = i
                i += 2
                while (i < n && source[i]!=='\n') i++
                push('line', start, i)
                continue
            }
            if (c==='/' && source[i + 1]==='*') {
                const start = i
                i += 2
                while (i < n && !(source[i]==='*' && source[i + 1]==='/')) i++
                i = Math.min(n, i + 2)
                push('block', start, i, source.slice(start, i))
                continue
            }
            if (c==='/' && slashStartsRegex()) {
                scanRegex()
                continue
            }
            if (c==='\'' || c==='"') {
                const start = i
                const quote = c
                i++
                while (i < n) {
                    if (source[i]==='\\') {
                        i += 2
                        continue
                    }
                    if (source[i]===quote) {
                        i++
                        break
                    }
                    i++
                }
                push('str', start, i)
                continue
            }
            if (c==='`') {
                scanTemplate()
                continue
            }
            if (/[A-Za-z_$]/.test(c)) {
                const start = i
                i++
                while (i < n && /[A-Za-z0-9_$]/.test(source[i])) i++
                const text = source.slice(start, i)
                push(WORDS.has(text) ? 'kw': 'ident', start, i, text)
                continue
            }
            if (/[0-9]/.test(c)) {
                const start = i
                i++
                while (i < n && /[0-9A-Za-z_.]/.test(source[i])) i++
                push('num', start, i, source.slice(start, i))
                continue
            }
            const three = source.slice(i, i + 3)
            const two   = source.slice(i, i + 2)
            if (three==='...' || three==='===' || three==='!==') {
                push('punct', i, i + 3, three)
                i += 3
                continue
            }
            if ([ '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--' ].includes(two)) {
                push('punct', i, i + 2, two)
                i += 2
                continue
            }
            if (c==='{') brace++
            if (c==='}' && brace > 0) brace--
            if (c==='(') paren++
            if (c===')' && paren > 0) paren--
            if (c==='[') bracket++
            if (c===']' && bracket > 0) bracket--
            push('punct', i, i + 1, c)
            i++
        }
    }

    /**
     * Whether the next `/` begins a regular expression rather than division.
     *
     * @returns `true` when a regex literal is legal here.
     */
    function slashStartsRegex() {
        const prev = previousCode()
        if (!prev) return true
        if (prev.kind==='ident' || prev.kind==='num' || prev.kind==='str' || prev.kind==='tmpl' || prev.kind==='regex') return false
        if ([ ')', ']', '++', '--', '}' ].includes(prev.text || '')) return false
        return true
    }

    scanCode(false)
    return tokens
}

/**
 * Index of the token that matches `open` at `index`.
 *
 * @param tokens - Token list.
 * @param index - Index of the opening token.
 * @param open - Opening spelling.
 * @param close - Closing spelling.
 * @returns Index of the matching closer, or the last token.
 */
function skipBalanced(tokens, index, open, close) {
    let depth = 0
    for (let cursor = index; cursor < tokens.length; cursor++) {
        if (tokens[cursor].text===open) depth++
        else if (tokens[cursor].text===close) {
            depth--
            if (depth===0) return cursor
        }
    }
    return Math.max(index, tokens.length - 1)
}

/**
 * Names of the top-level parameters inside a `(` token.
 *
 * @param tokens - Token list.
 * @param openIndex - Index of `(`.
 * @returns The names and the index of the closing `)`.
 */
function parameterNames(tokens, openIndex) {
    const close = skipBalanced(tokens, openIndex, '(', ')')
    const names = []
    let depth   = 0
    let current = []

    /**
     * Keeps the binding name from the parameter buffered so far.
     *
     * @returns Nothing. A name may be pushed onto `names`.
     */
    function flush() {
        const useful = current.filter((token) => token.kind!=='block')
        current      = []
        let start    = 0
        while ([ 'public', 'private', 'protected', 'readonly', 'override' ].includes(useful[start]?.text || '')) start++
        const first = useful[start]
        if (!first || first.text==='this') return
        if (first.text==='...') {
            const id = useful.slice(start + 1).find((token) => token.kind==='ident')
            if (id?.text) names.push(id.text)
            return
        }
        if (first.text==='{' || first.text==='[') {
            const id = useful.slice(start + 1).find((token) => token.kind==='ident')
            names.push(id?.text || 'value')
            return
        }
        if (first.kind==='ident') names.push(first.text)
    }

    for (let cursor = openIndex + 1; cursor < close; cursor++) {
        const token = tokens[cursor]
        if ([ '(', '{', '[', '<' ].includes(token.text || '')) depth++
        else if ([ ')', '}', ']', '>' ].includes(token.text || '') && depth > 0) depth--
        else if (token.text===',' && depth===0) {
            flush()
            continue
        }
        current.push(token)
    }
    flush()
    return { names, close }
}

/**
 * Whether `return` at `index` yields a value. A line break after `return` does not.
 *
 * @param source - File text.
 * @param tokens - Token list.
 * @param index - Index of the `return` keyword.
 * @returns `true` when an expression follows on the same line.
 */
function returnHasValue(source, tokens, index) {
    const next = tokens[index + 1]
    if (!next || next.text===';' || next.text==='}') return false
    return !source.slice(tokens[index].end, next.start).includes('\n')
}

/**
 * Whether the function body returns a value outside nested functions.
 *
 * @param source - File text.
 * @param tokens - Token list.
 * @param openBrace - Index of the body `{`.
 * @returns `true` when this function itself returns a value.
 */
function bodyReturns(source, tokens, openBrace) {
    let depth = 0
    for (let cursor = openBrace; cursor < tokens.length; cursor++) {
        const token = tokens[cursor]
        if (token.text==='{') {
            depth++
            continue
        }
        if (token.text==='}') {
            depth--
            if (depth===0) return false
            continue
        }
        if (depth >= 1 && token.text==='function') {
            cursor = endOfNestedFunction(tokens, cursor)
            continue
        }
        if (depth >= 1 && token.text==='=>') {
            if (tokens[cursor + 1]?.text==='{') cursor = skipBalanced(tokens, cursor + 1, '{', '}')
            continue
        }
        if (depth===1 && token.text==='return' && returnHasValue(source, tokens, cursor)) return true
    }
    return false
}

/**
 * Index of the last token in a nested `function`.
 *
 * @param tokens - Token list.
 * @param functionIndex - Index of the `function` keyword.
 * @returns Index of the closing body brace, or the keyword when the body is missing.
 */
function endOfNestedFunction(tokens, functionIndex) {
    let cursor = functionIndex + 1
    if (tokens[cursor]?.kind==='ident') cursor++
    if (tokens[cursor]?.text==='<') cursor = skipBalanced(tokens, cursor, '<', '>') + 1
    if (tokens[cursor]?.text==='(') cursor = skipBalanced(tokens, cursor, '(', ')') + 1
    while (cursor < tokens.length && tokens[cursor].text!=='{' && tokens[cursor].text!==';') cursor++
    if (tokens[cursor]?.text==='{') return skipBalanced(tokens, cursor, '{', '}')
    return functionIndex
}

/**
 * Whether the function after a parameter list produces a value.
 *
 * @param source - File text.
 * @param tokens - Token list.
 * @param closeParen - Index of the closing `)`.
 * @returns `returns` plus the written return type, when one is present.
 */
function functionReturns(source, tokens, closeParen) {
    let cursor   = closeParen + 1
    let typeText = ''
    if (tokens[cursor]?.text===':') {
        cursor++
        let depth   = 0
        const parts = []
        for (; cursor < tokens.length; cursor++) {
            const token = tokens[cursor]
            if ((token.text==='{' || token.text===';' || token.text==='=>') && depth===0) break
            if ([ '{', '(', '<', '[' ].includes(token.text || '')) depth++
            else if ([ '}', ')', '>', ']' ].includes(token.text || '') && depth > 0) depth--
            else if (token.text) parts.push(token.text)
        }
        typeText = parts.join('')
    }
    const compact = typeText.replace(/\s+/g, '')
    const voidish = /^(void|undefined|never|Promise<void>|Promise<undefined>|Promise<never>)$/.test(compact)
    if (compact && !voidish) return { returns: true, typeText: compact }
    if (tokens[cursor]?.text==='{') return { returns: bodyReturns(source, tokens, cursor), typeText: compact }
    if (tokens[cursor]?.text===';') return { returns: false, typeText: compact }
    if (tokens[cursor]?.text==='=>') {
        if (tokens[cursor + 1]?.text==='{') return {
            returns:  bodyReturns(source, tokens, cursor + 1),
            typeText: compact
        }
        return { returns: true, typeText: compact }
    }
    return { returns: false, typeText: compact }
}

/**
 * JSDoc block immediately above the statement, if one is present.
 *
 * @param source - File text.
 * @param tokens - Token list including block comments.
 * @param anchor - First token of the statement.
 * @returns The comment token, or `null`.
 */
function attachedDoc(source, tokens, anchor) {
    let cursor = anchor - 1
    while (cursor >= 0 && tokens[cursor].kind==='line') cursor--
    const comment = tokens[cursor]
    if (!comment || comment.kind!=='block' || !comment.text?.startsWith('/**')) return null
    if (!/^[\s]*$/.test(source.slice(comment.end, tokens[anchor].start))) return null
    return comment
}

/**
 * First token of the statement that owns `focus`.
 *
 * @param tokens - Token list.
 * @param focus - Keyword, name, or `=>` of the function.
 * @returns Index of `export`, `const`, or the function token itself.
 */
function statementAnchor(tokens, focus) {
    let cursor = focus
    while (cursor > 0 && [ 'async', 'get', 'set', 'static', 'public', 'private', 'protected', 'readonly', 'abstract', 'declare' ].includes(tokens[cursor - 1].text || '')) {
        cursor--
    }
    while (cursor > 0 && [ 'export', 'default' ].includes(tokens[cursor - 1].text || '')) cursor--
    if (tokens[cursor - 1]?.text==='=') {
        let assign = cursor - 1
        if (tokens[assign - 1]?.kind==='ident' || tokens[assign - 1]?.kind==='kw') assign--
        while (assign > 0 && (tokens[assign - 1].text==='.' || tokens[assign - 1].text==='?.')) assign -= 2
        while (assign > 0 && [ 'const', 'let', 'var', 'export', 'default' ].includes(tokens[assign - 1].text || '')) assign--
        cursor = assign
    }
    return cursor
}

/**
 * Problems with one JSDoc block.
 *
 * @param doc - Comment text, or `null` when the function has none.
 * @param names - Parameter names.
 * @param returns - Whether the function produces a value.
 * @returns Missing-piece descriptions. Empty when the block is enough.
 */
function docIssues(doc, names, returns) {
    if (!doc) return [ 'missing JSDoc' ]
    const lines  = doc
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
    const issues = []
    if (!lines.some((line) => !line.startsWith('@'))) issues.push('missing summary')
    for (const name of names) {
        const tagged = lines.some((line) => new RegExp(`^@param\\s+(?:\\{[^}]*\\}\\s+)?${name}\\b`).test(line))
        if (!tagged) issues.push(`missing @param ${name}`)
    }
    if (returns && !lines.some((line) => line.startsWith('@returns') || line.startsWith('@return'))) {
        issues.push('missing @returns')
    }
    return issues
}

/**
 * Functions in one file that still need JSDoc.
 *
 * @param file - Absolute path.
 * @param root - Repository root, used for the reported path.
 * @returns Gap records for this file.
 */
function gapsInFile(file, root) {
    const source = readFileSync(file, 'utf8')
    const tokens = tokenize(source).filter((token) => token.kind!=='line')
    const gaps   = []

    /**
     * Records one function when its JSDoc is incomplete.
     *
     * @param focus - Token index used to find the statement.
     * @param name - Function name.
     * @param openParen - Index of `(`.
     * @param forceAnchor - Statement token when it is not implied by `focus`.
     * @returns Nothing.
     */
    function consider(focus, name, openParen, forceAnchor) {
        const { names, close } = parameterNames(tokens, openParen)
        const result           = functionReturns(source, tokens, close)
        const anchor           = forceAnchor ?? statementAnchor(tokens, focus)
        const comment          = attachedDoc(source, tokens, anchor)
        const issues           = docIssues(comment?.text || null, names, name==='constructor' ? false: result.returns)
        if (issues.length===0) return
        const where = source.slice(0, tokens[focus].start).split('\n').length
        gaps.push({
            file,
            relative: relative(root, file),
            line:     where,
            name,
            issues,
            anchor:   tokens[anchor].start,
            comment:  comment ? { start: comment.start, end: comment.end, text: comment.text }: null,
            names,
            returns:  name==='constructor' ? false: result.returns,
            typeText: result.typeText
        })
    }

    for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index]
        if (token.kind==='kw' && token.text==='function') {
            const name = tokens[index + 1]?.kind==='ident' ? tokens[index + 1].text: 'anonymous function'
            let open   = tokens[index + 1]?.kind==='ident' ? index + 2: index + 1
            if (tokens[open]?.text==='<') open = skipBalanced(tokens, open, '<', '>') + 1
            if (tokens[open]?.text==='(') consider(index, name || 'anonymous function', open)
            continue
        }

        if (token.kind==='ident' && HANDLERS.has(token.text || '') && tokens[index + 1]?.text==='(') {
            let cursor = index + 2
            if (tokens[cursor]?.text==='async') cursor++
            if (tokens[cursor]?.text==='(' && tokens[skipBalanced(tokens, cursor, '(', ')') + 1]?.text==='=>') {
                let anchor = index
                while (anchor > 0 && [ 'export', 'default' ].includes(tokens[anchor - 1].text || '')) anchor--
                consider(cursor, token.text || 'handler', cursor, anchor)
            }
            continue
        }

        if ((token.kind==='ident' || token.text==='constructor') && tokens[index + 1]?.text==='(') {
            const previous = tokens[index - 1]
            if ([ '.', '?.', 'function', 'new' ].includes(previous?.text || '')) continue
            if ([ 'if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'throw', 'case', 'await' ].includes(previous?.text || '')) continue
            const close = skipBalanced(tokens, index + 1, '(', ')')
            let after   = close + 1
            if (tokens[after]?.text===':') {
                let depth = 0
                after++
                for (; after < tokens.length; after++) {
                    const next = tokens[after]
                    if ((next.text==='{' || next.text===';' || next.text==='=>') && depth===0) break
                    if ([ '{', '(', '<', '[' ].includes(next.text || '')) depth++
                    else if ([ '}', ')', '>', ']' ].includes(next.text || '') && depth > 0) depth--
                }
            }
            const isBody      = tokens[after]?.text==='{'
            const modifier    = [ 'async', 'get', 'set', 'static', 'public', 'private', 'protected', 'readonly' ].includes(previous?.text || '')
            const atStatement = !previous || modifier || previous.text==='{' || previous.text===';' || previous.text==='}'
            if (isBody && atStatement) consider(index, token.text || 'method', index + 1)
            continue
        }

        if (token.text==='=>') {
            let cursor = index - 1
            if (tokens[cursor]?.text===')') cursor = skipBalancedBack(tokens, cursor)
            else if (tokens[cursor]?.kind==='ident') cursor--
            else continue
            if (tokens[cursor]?.text==='async') cursor--
            if (tokens[cursor]?.text!=='=') continue
            const name = tokens[cursor - 1]?.kind==='ident' ? tokens[cursor - 1].text: 'arrow'
            let open   = index - 1
            if (tokens[open]?.text!==')') {
                continue
            }
            open = skipBalancedBack(tokens, open)
            if (tokens[open]?.text==='(') consider(index, name || 'arrow', open)
        }
    }

    return gaps
}

/**
 * Index of the `(` that matches a `)` at `index`.
 *
 * @param tokens - Token list.
 * @param index - Index of `)`.
 * @returns Index of `(`.
 */
function skipBalancedBack(tokens, index) {
    let depth = 0
    for (let cursor = index; cursor >= 0; cursor--) {
        if (tokens[cursor].text===')') depth++
        else if (tokens[cursor].text==='(') {
            depth--
            if (depth===0) return cursor
        }
    }
    return index
}

/**
 * JSDoc gaps for every project script under `root`.
 *
 * @param root - Repository root.
 * @returns One record per function that still needs documentation.
 */
export function findJsDocRecords(root) {
    const records = []
    for (const file of listScripts(root)) {
        records.push(...gapsInFile(file, root))
    }
    return records
}

/**
 * Short lines a test can assert are empty when every function is documented.
 *
 * @param root - Repository root.
 * @returns `file:line name issue` lines.
 */
export function findJsDocGaps(root) {
    return findJsDocRecords(root).map((record) => {
        return `${record.relative}:${record.line} ${record.name} :: ${record.issues.join('; ')}`
    })
}
