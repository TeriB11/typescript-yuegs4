export function createSlider(options: {
  min: number,
  max: number,
  initialValue: number,
  stepSize?: number,
  label?: string,
}, didChange: (newValue: number) => void): HTMLElement {
  const container = document.createElement('div')
  container.style.display = 'flex'
  container.style.backgroundColor = '#cfcfcf'
  container.style.padding = '4px'
  container.style.borderRadius = '4px'
  container.style.margin = '4px'

  const slider = document.createElement('input')
  slider.type = 'range'
  slider.min = options.min.toString()
  slider.max = options.max.toString()
  slider.value = options.initialValue.toString()
  slider.step = options.stepSize?.toString() ?? 'any'
  container.appendChild(slider)

  const text = document.createElement('input')
  text.style.width = '36px'
  text.value = options.initialValue.toString()

  if (options.label) {
    const label = document.createElement('div')
    label.innerText = options.label
    label.style.marginRight = '8px'
    container.appendChild(label)
  }

  container.appendChild(text)
  container.appendChild(slider)

  function getValue(v : number): number {
    let value = v

    value = Math.min(options.max, value)
    value = Math.max(options.min, value)

    // if (options.stepSize) {
    //   value -= ((value - options.min) % options.stepSize)
    // }

    const n = 10000
    const r = Math.floor(value * n)/n
    didChange(r)
    return r
  }

  slider.oninput = () => {
    text.value = getValue(Number.parseFloat(slider.value)).toString()
  }

  text.oninput = () => {
    slider.value = getValue(Number.parseFloat(text.value)).toString()
  }
  text.onchange = () => {
    text.value = getValue(Number.parseFloat(text.value)).toString()
  }

  return container
}

export function createRow(...elements: HTMLElement[]): HTMLElement {
  const container = document.createElement('div')
  container.style.display = 'flex'

  elements.forEach(element => container.appendChild(element))
  return container
}