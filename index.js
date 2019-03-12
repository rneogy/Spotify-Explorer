let width = window.innerWidth;
let height = 0.9 * window.innerHeight;
const padding = 30;

const parseTime = d3.timeParse("%Y-%m-%d");

const songText = document.querySelector("#song-text");
const streamCountText = document.querySelector("#stream-count-text");
const selectedSongText = document.querySelector("#selected-song-text");
const selectedStreamCountText = document.querySelector(
  "#selected-stream-count-text"
);

let selectedSong;
let selectedDate;

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

  const y = d3.scaleLinear();

  const r = d3.scaleLog().range([5, 20]);

  const color = d3.scaleSequential().interpolator(d3.interpolateInferno);

  const xAxis = d3.axisBottom().scale(x);

  d3.select(".chart")
    .append("g")
    .attr("transform", `translate(0,${height - padding})`)
    .attr("id", "x-axis")
    .transition()
    .duration(2000)
    .call(xAxis);

  const yAxis = d3.axisRight(y).tickFormat(function(d) {
    const s = d / 1e3;
    return this.parentNode.nextSibling ? s : s + "k streams";
  });

  d3.select(".chart")
    .append("g")
    .attr("id", "y-axis")
    .attr("transform", `translate(${padding}, 0)`);

  const render = function() {
    const region = document.querySelector("#country-select").value;
    width = window.innerWidth;
    height = 0.9 * window.innerHeight;
    const newData = data.filter(d => {
      if (region) {
        return d.Region === region;
      }
      return d.Region === regions[0];
    });

    streamExtent = d3.extent(newData, d => parseInt(d.Streams));

    y.domain(streamExtent)
      .range([height - padding * 1.5, padding])
      .nice();
    r.domain(streamExtent);
    color.domain(streamExtent);

    x.range([2.5 * padding, width - padding]);

    d3.select("#x-axis")
      .transition()
      .duration(2000)
      .attr("transform", `translate(0,${height - padding})`)
      .call(xAxis);

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

    const highlightSong = (song, streams) => {
      songText.innerText = song;
      streamCountText.innerText = streams / 1e3 + "k streams";
      d3.selectAll(`circle[song="${song}"]`)
        .transition()
        .attr("stroke", "yellow");
    };

    const selectSong = (song, streams, el) => {
      selectedSongText.innerText = "Selected: " + song;
      selectedStreamCountText.innerText = streams / 1e3 + "k streams";
      d3.select(el).transition()
        .attr("stroke", "blue");
    };

    const unhighlightSong = song => {
      songText.innerText = "";
      streamCountText.innerText = "";
      d3.selectAll(`circle[song="${song}"]`)
        .filter((d) => !(d.Date === selectedDate && d["Track Name"] === selectedSong))
        .transition()
        .attr("stroke", "black");
    };

    const unselectSong = (el) => {
      selectedSongText.innerText = "";
      selectedStreamCountText.innerText = "";
      d3.select(el).transition()
        .attr("stroke", "black");
    };

    const newCircles = circles
      .enter()
      .append("circle")
      .attrs(d => {
        return {
          transform: `translate(${x(parseTime(d.Date))}, ${(2 * height) / 3})`,
          cx: 0,
          cy: 0,
          r: 0,
          "stroke-width": 0,
          stroke: "black",
          song: d["Track Name"],
          opacity: 0.8
        };
      })
      .style("fill", d => color(parseInt(d.Streams)))
      .on("mouseover", function(d) {
        highlightSong(d["Track Name"], d.Streams);
      })
      .on("mouseout", function(d) {
        unhighlightSong(d["Track Name"]);
      })
      .on("click", function(d) {
        if (selectedSong) {
          unselectSong(selectedSong);
        }
        selectedSong = this
        selectedDate = d.Date;
        selectSong(d["Track Name"], d.Streams, this);
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
      .attrs({
        transform: d =>
          `translate(${x(parseTime(d.Date))}, ${y(parseInt(d.Streams))})`,
        song: d => d["Track Name"],
        r: d => r(parseInt(d.Streams))
      })
      .style("fill", d => color(parseInt(d.Streams)));
  };

  select.on("change", render);

  window.addEventListener("resize", render);

  render();
});
