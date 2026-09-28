d3.json("anonymized-data.json").then(function(data) {
  barChart(data)
  pieChart(data)
  streamGraph(data)
}).catch(function(error) {
  console.error("Error loading JSON:", error)
})

function barChart(data) {
  const container = d3.select("#bar-chart")

  // Aggregate by month
  const monthlyData = d3.rollups(
    data,
    values => d3.sum(values, d => d.text_length),
    d => d3.timeMonth(d3.isoParse(d.date))
  )
  .map(([date, text_length]) => ({ date, text_length }))
  .sort((a, b) => d3.ascending(a.date, b.date))

  // Dynamic dimensions
  const barWidth = 40
  const barGap = 10

  const margin = {
    top: 30,
    right: 30,
    bottom: 70,
    left: 60
  }

  const width = Math.min(
    margin.left + margin.right + monthlyData.length * (barWidth + barGap),
    window.innerWidth
  )

  const height = 500

  // Create SVG
  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height)

  // X scale
  const x = d3.scaleBand()
    .domain(monthlyData.map(d => d.date))
    .range([margin.left, width - margin.right])
    .padding(0.2)

  // Y scale
  const y = d3.scaleLinear()
    .domain([0, d3.max(monthlyData, d => d.text_length)])
    .nice()
    .range([height - margin.bottom, margin.top])

  // X axis
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(
      d3.axisBottom(x)
        .tickFormat(d3.timeFormat("%b %Y"))
    )
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")

  // Y axis
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))

  // Bars
  svg.selectAll(".bar")
    .data(monthlyData)
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.date))
    .attr("y", d => y(d.text_length))
    .attr("width", x.bandwidth())
    .attr("height", d => y(0) - y(d.text_length))
    .attr("fill", "blue")

    // tooltip on hover
    const tooltip = container
      .append("div")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "2px solid " + d3.schemeTableau10[0])
      .style("padding", "5px 10px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("color", "" + d3.schemeTableau10[0])

  svg.selectAll(".bar")
    .data(monthlyData)
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.date))
    .attr("y", d => y(d.text_length))
    .attr("width", x.bandwidth())
    .attr("height", d => y(0) - y(d.text_length))
    .attr("fill", "" + d3.schemeTableau10[0])
    .on("mouseover", function(event, d) {
      tooltip
        .style("opacity", 1)
        .html(`${d.text_length}`)
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 30}px`)
    })
    .on("mouseout", function() {
      tooltip.style("opacity", 0)
    })
}

function pieChart(data) {
  const container = d3.select("#pie-chart")

  const moodData = Array.from(
    d3.rollup(
      data.filter(d => d.mood != null),
      values => values.length,
      d => d.mood
    ),
    ([mood, count]) => ({ mood, count })
  )

  // Parent layout
  container
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "30px")

  // Create SVG inside the parent
  const svg = container
    .append("svg")
    .attr("width", 500)
    .attr("height", 500)

  const chart = svg
    .append("g")
    .attr("transform", `translate(250, 250)`)

  // Pie
  const pie = d3.pie()
    .value(d => d.count)

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(200)

  const colors = d3.scaleOrdinal(d3.schemeTableau10)

  // Draw slices
  const slices = pie(moodData)
  chart.selectAll("path")
    .data(slices)
    .join("path")
    .attr("class", d => `slice mood-${d.data.mood}`)
    .attr("d", arc)
    .attr("fill", d => colors(d.data.mood))

  // Legend
  const legend = container
    .append("div")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("gap", "8px")

    const legendItems = legend.selectAll(".legend-item")
    .data(moodData)
    .join("div")
    .attr("class", "legend-item")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "8px")
    .style("cursor", "pointer")

  legendItems.append("div")
    .style("width", "15px")
    .style("height", "15px")
    .style("background-color", d => colors(d.mood))

  legendItems.append("span")
  .text(d => `${d.mood}: ${d.count}`)

  // Highlight effect on hover
  function highlightMood(mood) {
    chart.selectAll(".slice")
      .style("opacity", d =>
        d.data.mood === mood ? 1 : 0.4
      )

    legend.selectAll(".legend-item")
      .style("opacity", d =>
        d.mood === mood ? 1 : 0.4
      )
  }

  function clearHighlight() {
    chart.selectAll(".slice")
      .style("opacity", 1)

    legend.selectAll(".legend-item")
      .style("opacity", 1)
  }

  chart.selectAll(".slice")
  .on("mouseenter", function(event, d) {
    highlightMood(d.data.mood)
  })
  .on("mouseleave", function() {
    clearHighlight()
  })

  legend.selectAll(".legend-item")
  .on("mouseenter", function(event, d) {
    highlightMood(d.mood)
  })
  .on("mouseleave", function() {
    clearHighlight()
  })
}

const WORDS = [
  'i',
  'am',
  'not',
  'me',
  'and',
  'you',
  'love',
  'red'
]

function streamGraph(data) {
    const container = d3.select("#stream-graph")
    const margin = { top: 30, right: 30, bottom: 60, left: 60 }
    const width = 1000
    const height = 500

    const entries = data.map(d => ({
        date: new Date(d.date),
        text: d.text || ""
    }))

    // Normalize WORDS for matching, while retaining their original
    // spelling for labels.
    const words = WORDS.map(word => ({
        label: word,
        key: word.toLowerCase()
    }))

    // Aggregate by month

    const monthMap = new Map()

    entries.forEach(entry => {
        // First day of the entry's month
        const month = new Date(
            entry.date.getFullYear(),
            entry.date.getMonth(),
            1
        )

        const monthKey = +month

        if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, {
                date: month,
                entries: [],
                ...Object.fromEntries(words.map(w => [w.label, 0]))
            })
        }

        const monthData = monthMap.get(monthKey)
        monthData.entries.push(entry)

        // Count occurrences of every word.
        words.forEach(word => {
            const escaped = word.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

            // Match whole words, case-insensitively.
            const regex = new RegExp(`\\b${escaped}\\b`, "gi")
            const matches = entry.text.match(regex)

            monthData[word.label] += matches ? matches.length : 0
        })
    })

    const monthlyData = Array.from(monthMap.values())
        .sort((a, b) => a.date - b.date)

    // Create svg

    d3.select("#streamgraph").remove()

    const svg = container
        .append("svg")
        .attr("id", "streamgraph")
        .attr("width", width)
        .attr("height", height)

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)

    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Create d3 stack

    const stack = d3.stack()
        .keys(words.map(w => w.label))
        .offset(d3.stackOffsetWiggle)
        .order(d3.stackOrderInsideOut)

    const series = stack(monthlyData)

    // Make a scale for the time

    const x = d3.scaleTime()
        .domain(d3.extent(monthlyData, d => d.date))
        .range([0, innerWidth])

    const y = d3.scaleLinear()
        .domain([
            d3.min(series, layer => d3.min(layer, d => d[0])),
            d3.max(series, layer => d3.max(layer, d => d[1]))
        ])
        .range([innerHeight, 0])

    const color = d3.scaleOrdinal()
        .domain(words.map(w => w.label))
        .range(d3.schemeTableau10)

    // Draw the graph

    const area = d3.area()
        .x((d, i) => x(monthlyData[i].date))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))
        .curve(d3.curveBasis)

    const layers = g.selectAll(".layer")
        .data(series)
        .join("path")
        .attr("class", "layer")
        .attr("d", area)
        .attr("fill", d => color(d.key))
        .attr("opacity", 0.8)
        .style("cursor", "pointer")

    // Create a x axis

    const xAxis = d3.axisBottom(x)
        .ticks(d3.timeMonth.every(3))
        .tickFormat(d3.timeFormat("%b %Y"))

    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")

    // Make months selectable

    const monthWidth = monthlyData.length > 1
        ? x(monthlyData[1].date) - x(monthlyData[0].date)
        : innerWidth

    const selection = g.append("rect")
        .attr("class", "month-selection")
        .attr("y", 0)
        .attr("height", innerHeight)
        .attr("fill", "transparent")
        .style("pointer-events", "none")

    const tooltip = container
        .append("div")
        .attr("class", "streamgraph-tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("background", "white")
        .style("border", "2px solid " + d3.schemeTableau10[0])
        .style("border-radius", "4px")
        .style("padding", "8px")
        .style("font", "12px sans-serif")

    // Handle on click to show entries

    svg.on("mousemove", function(event) {
        const [mouseX] = d3.pointer(event, g.node())

        // Find nearest month
        const date = x.invert(mouseX)

        const index = d3.bisector(d => d.date).center(
            monthlyData,
            date
        )

        const month = monthlyData[index]

        if (!month) return

        const values = words
            .map(word => ({
                word: word.label,
                count: month[word.label]
            }))
            .filter(d => d.count > 0)

        tooltip
            .style("opacity", 1)
            .html(`
                <strong>${d3.timeFormat("%B %Y")(month.date)}</strong>
                ${values.length
                    ? values.map(d => `${d.word}: ${d.count}`).join("<br>")
                    : "<br>No matches"}
            `)
            .style("left", `${event.pageX + 12}px`)
            .style("top", `${event.pageY - 20}px`)
    })

    svg.on("mouseleave", function() {
        tooltip.style("opacity", 0)
    })

    svg.on("click", function(event) {
        const [mouseX] = d3.pointer(event, g.node())
        const date = x.invert(mouseX)

        const index = d3.bisector(d => d.date).center(
            monthlyData,
            date
        )

        const month = monthlyData[index]

        if (!month) return

        showEntries(month)
    })

    // Display entries below the graph

    function showEntries(month) {
        d3.select("#streamgraph-entries").remove()

        // Highlight selected month
        selection
            .attr("x", x(month.date) - monthWidth / 2)
            .attr("width", monthWidth)
            .attr("fill", "rgba(0, 0, 0, 0.08)")
            .style("pointer-events", "none")

        const container2 = container
            .append("div")
            .attr("id", "streamgraph-entries")
            .style("max-width", `${width}px`)
            .style("margin", "20px auto")

        container2.append("h3")
            .text(d3.timeFormat("%B %Y")(month.date))

        const entries = container2.append("div")
            .attr("class", "entries")

        const checker = value =>
          WORDS.some(word =>
              new RegExp(`\\b${word}\\b`, "i").test(value)
          );

        month.entries
            .sort((a, b) => a.date - b.date)
            .filter(entry => checker(entry.text))
            .forEach(entry => {
                const row = entries.append("div")
                    .style("margin-bottom", "12px")
                    .style("padding", "8px")
                    .style("border-bottom", "1px solid " + d3.schemeTableau10[0])

                row.append("div")
                    .style("font-size", "12px")
                    .style("color", "#666")
                    .text(d3.timeFormat("%Y-%m-%d")(entry.date))

                row.append("div") .html(highlightWords(entry.text))
            })
    }

    // Legend

    const legend = svg.append("g")
        .attr("transform", `translate(${margin.left}, 10)`)

    words.forEach((word, i) => {
        const item = legend.append("g")
            .attr("transform", `translate(${i * 100}, 0)`)

        item.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color(word.label))

        item.append("text")
            .attr("x", 17)
            .attr("y", 10)
            .style("font-size", "12px")
            .text(word.label)
    })
}

function highlightWords(text) {
    if (!WORDS.length) {
        return escapeHtml(text)
    }

    // Escape the words before putting them into a regex.
    const escapedWords = WORDS
        .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .sort((a, b) => b.length - a.length)

    const regex = new RegExp(
        `\\b(${escapedWords.join("|")})\\b`,
        "gi"
    )

    return escapeHtml(text).replace(regex, match =>
        `<mark>${match}</mark>`
    )
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp")
        .replace(/</g, "&lt")
        .replace(/>/g, "&gt")
        .replace(/"/g, "&quot")
        .replace(/'/g, "&#039")
}