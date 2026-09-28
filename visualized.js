d3.json("anonymized-data.json").then(function(data) {
  barChart(data)
  pieChart(data)
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
  const container = d3.select("#pie-chart");

  const moodData = Array.from(
  d3.rollup(
    data.filter(d => d.mood != null),
    values => values.length,
    d => d.mood
  ),
  ([mood, count]) => ({ mood, count })
);

// Parent layout
container
  .style("display", "flex")
  .style("align-items", "center")
  .style("gap", "30px");

// Create SVG inside the parent
const svg = container
  .append("svg")
  .attr("width", 500)
  .attr("height", 500);

const chart = svg
  .append("g")
  .attr("transform", `translate(250, 250)`);

// Pie
const pie = d3.pie()
  .value(d => d.count);

const arc = d3.arc()
  .innerRadius(0)
  .outerRadius(200);

const colors = d3.scaleOrdinal(d3.schemeTableau10);

// Draw slices
const slices = pie(moodData);
chart.selectAll("path")
  .data(slices)
  .join("path")
  .attr("class", d => `slice mood-${d.data.mood}`)
  .attr("d", arc)
  .attr("fill", d => colors(d.data.mood));

// Legend
const legend = container
  .append("div")
  .style("display", "flex")
  .style("flex-direction", "column")
  .style("gap", "8px");

  const legendItems = legend.selectAll(".legend-item")
  .data(moodData)
  .join("div")
  .attr("class", "legend-item")
  .style("display", "flex")
  .style("align-items", "center")
  .style("gap", "8px")
  .style("cursor", "pointer");

legendItems.append("div")
  .style("width", "15px")
  .style("height", "15px")
  .style("background-color", d => colors(d.mood));

legendItems.append("span")
  .text(d => `${d.mood}: ${d.count}`);

  // Highlight effect on hover
  function highlightMood(mood) {
    chart.selectAll(".slice")
      .style("opacity", d =>
        d.data.mood === mood ? 1 : 0.4
      );

    legend.selectAll(".legend-item")
      .style("opacity", d =>
        d.mood === mood ? 1 : 0.4
      );
  }

  function clearHighlight() {
    chart.selectAll(".slice")
      .style("opacity", 1);

    legend.selectAll(".legend-item")
      .style("opacity", 1);
  }

  chart.selectAll(".slice")
  .on("mouseenter", function(event, d) {
    highlightMood(d.data.mood);
  })
  .on("mouseleave", function() {
    clearHighlight();
  });

  legend.selectAll(".legend-item")
  .on("mouseenter", function(event, d) {
    highlightMood(d.mood);
  })
  .on("mouseleave", function() {
    clearHighlight();
  });
}