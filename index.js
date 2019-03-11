const width = window.innerWidth;
const height = 0.9 * window.innerHeight;
const padding = 30;

const parseTime = d3.timeParse("%Y-%m-%d");

const x = d3
  .scaleTime()
  .domain([new Date(2017, 0, 1), new Date(2018, 0, 8)])
  .range([padding, width - padding]);

d3.csv("./processed_data.csv").then(data => {
  const regions = d3.map(data, d => d.Region).keys();
  const select = d3.select("#country-select");
  select
    .selectAll("option")
    .data(regions)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  const fData = data.filter(d => d.Region == regions[0]);
  console.log(fData[0]);

  let streamExtent = d3.extent(fData, d => parseInt(d.Streams));

  const y = d3
    .scaleLinear()
    .domain(streamExtent)
    .range([height - padding * 2, padding * 4]);

  const r = d3
    .scaleLog()
    .domain(streamExtent)
    .range([5, 20]);

  const color = d3
    .scaleSequential()
    .domain(streamExtent)
    .interpolator(d3.interpolateInferno);

  const chartData = d3
    .select(".chart")
    .selectAll("g")
    .data(fData);

  const fDataEnter = chartData.enter();

  chartData.exit().remove();

  const group = fDataEnter
    .append("g")
    .classed("circle-group", true)
    .attr(
      "transform",
      d => `translate(${x(parseTime(d.Date))}, ${(2 * height) / 3})`
    )
    .style("opacity", 0);

  group
    .transition()
    .duration(2000)
    .delay((_, i) => i * 2)
    .attr(
      "transform",
      d => `translate(${x(parseTime(d.Date))}, ${y(parseInt(d.Streams))})`
    )
    .style("opacity", 1);

  group
    .append("circle")
    .attrs(d => {
      return {
        cx: 0,
        cy: 0,
        r: r(parseInt(d.Streams)),
        "stroke-width": 2,
        stroke: "black"
      };
    })
    .style("fill", d => color(parseInt(d.Streams)))
    .on("mouseover", function(_, i) {
      d3.select("#tooltip-" + i)
        .classed("hidden", false)
        .style("opacity", 0)
        .transition()
        .duration(200)
        .style("opacity", 1);
    })
    .on("mouseout", function(_, i) {
      const tooltip = d3.select("#tooltip-" + i);
      tooltip
        .transition()
        .duration(200)
        .style("opacity", 0)
        .on("end", () => tooltip.classed("hidden", true));
    });

  fDataEnter
    .append("text")
    .classed("tooltip", true)
    .text(d => d["Track Name"])
    .attrs((d, i) => {
      return {
        id: "tooltip-" + i,
        x: x(parseTime(d.Date)),
        y: y(parseInt(d.Streams)) - padding,
        "text-anchor": "middle"
      };
    })
    .classed("hidden", true);
  d3.select(".chart")
    .append("g")
    .attr("transform", `translate(0,${height - padding})`)
    .attr("id", "x-axis")
    .call(d3.axisBottom().scale(x));

  select.on("change", function() {
    const newData = data.filter(
      d => d.Region == this.options[this.selectedIndex].value
    );

    streamExtent = d3.extent(newData, d => parseInt(d.Streams));

    y.domain(streamExtent);
    r.domain(streamExtent);
    color.domain(streamExtent);

    const circles = d3
      .select(".chart")
      .selectAll("g.circle-group")
      .data(newData);

    circles
      .exit()
      .transition()
      .duration(1000)
      .style("opacity", 0)
      .remove();

    const newGroups = circles
      .enter()
      .append("g")
      .classed("circle-group", true)
      .attr(
        "transform",
        d => `translate(${x(parseTime(d.Date))}, ${(2 * height) / 3})`
      )
      .style("opacity", 0);

    newGroups
      .transition()
      .duration(2000)
      .attr(
        "transform",
        d => `translate(${x(parseTime(d.Date))}, ${y(parseInt(d.Streams))})`
      )
      .style("opacity", 1);

    newGroups
      .append("circle")
      .attrs(d => {
        return {
          cx: 0,
          cy: 0,
          r: r(parseInt(d.Streams)),
          "stroke-width": 2,
          stroke: "black"
        };
      })
      .style("fill", d => color(parseInt(d.Streams)))
      .on("mouseover", function(_, i) {
        d3.select("#tooltip-" + i)
          .classed("hidden", false)
          .style("opacity", 0)
          .transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mouseout", function(_, i) {
        const tooltip = d3.select("#tooltip-" + i);
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0)
          .on("end", () => tooltip.classed("hidden", true));
      });

    circles
      .transition()
      .duration(2000)
      .attr(
        "transform",
        d => `translate(${x(parseTime(d.Date))}, ${y(parseInt(d.Streams))})`
      );

    circles
      .select("circle")
      .transition()
      .duration(2000)
      .attr("r", d => r(parseInt(d.Streams)))
      .style("fill", d => color(parseInt(d.Streams)));

    const tooltips = d3
      .select(".chart")
      .selectAll("text.tooltip")
      .data(newData);

    tooltips.exit().remove();

    tooltips
      .enter()
      .append("text")
      .classed("tooltip", true)
      .classed("hidden", true)
      .text(d => d["Track Name"])
      .attrs((d, i) => {
        return {
          id: "tooltip-" + i,
          x: x(parseTime(d.Date)),
          y: y(parseInt(d.Streams)) - padding,
          "text-anchor": "middle"
        };
      });

    tooltips
      .text(d => d["Track Name"])
      .attrs((d, i) => {
        return {
          id: "tooltip-" + i,
          x: x(parseTime(d.Date)),
          y: y(parseInt(d.Streams)) - padding,
          "text-anchor": "middle"
        };
      });
  });
});
