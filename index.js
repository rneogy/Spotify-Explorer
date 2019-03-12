const width = window.innerWidth;
const height = 0.9 * window.innerHeight;
const padding = 30;

const parseTime = d3.timeParse("%Y-%m-%d");

const x = d3
  .scaleTime()
  .domain([new Date(2017, 0, 1), new Date(2018, 0, 8)])
  .range([2.5 * padding, width - padding]);

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

  const y = d3
    .scaleLinear()
    .range([height - padding * 1.5, padding * 2])
    .nice();

  const r = d3.scaleLog().range([5, 20]);

  const color = d3.scaleSequential().interpolator(d3.interpolateInferno);

  d3.select(".chart")
    .append("g")
    .attr("transform", `translate(0,${height - padding})`)
    .attr("id", "x-axis")
    .transition()
    .duration(2000)
    .call(d3.axisBottom().scale(x));

  const yAxis = d3.axisRight(y).tickFormat(function(d) {
    const s = d / 1e3;
    return this.parentNode.nextSibling ? s : s + "k streams";
  });

  d3.select(".chart")
    .append("g")
    .attr("id", "y-axis")
    .attr("transform", `translate(${padding}, 0)`);

  const render = function() {
    const newData = data.filter(d => {
      if (this.selectedIndex) {
        return d.Region == this.options[this.selectedIndex].value;
      }
      return d.Region == regions[0];
    });

    streamExtent = d3.extent(newData, d => parseInt(d.Streams));

    y.domain(streamExtent).nice();
    r.domain(streamExtent);
    color.domain(streamExtent);

    d3.select("#y-axis")
      .transition()
      .duration(2000)
      .call(yAxis);

    const circles = d3
      .select(".chart")
      .selectAll("circle")
      .data(newData);

    circles
      .exit()
      .transition()
      .duration(1000)
      .attr("r", 0)
      .attr("stroke-width", 0)
      .remove();

    const newCircles = circles
      .enter()
      .append("circle")
      .attr(
        "transform",
        d => `translate(${x(parseTime(d.Date))}, ${(2 * height) / 3})`
      )
      .attrs(d => {
        return {
          cx: 0,
          cy: 0,
          r: 0,
          "stroke-width": 0,
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

    newCircles
      .transition()
      .duration(2000)
      .delay((_, i) => i * 2)
      .attr(
        "transform",
        d => `translate(${x(parseTime(d.Date))}, ${y(parseInt(d.Streams))})`
      )
      .attr("r", d => r(parseInt(d.Streams)))
      .attr("stroke-width", 2);

    circles
      .transition()
      .duration(2000)
      .attr("r", d => r(parseInt(d.Streams)))
      .attr(
        "transform",
        d => `translate(${x(parseTime(d.Date))}, ${y(parseInt(d.Streams))})`
      )
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
  };

  select.on("change", render);

  render();
});
