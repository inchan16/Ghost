module.exports = function captureStacktrace() {
    const stacks = Error()
        .stack.split('\n')
        .map((s) => s.trim())

    return stacks
}
