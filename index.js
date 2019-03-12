String.prototype.hashCode = function() {
  let hash = 0,
    i,
    chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

let width = window.innerWidth;
let height = 0.9 * window.innerHeight;
const padding = 30;
const defaultOpacity = 0.7;
const highlightOpacity = 0.85;
const selectedOpacity = 1;
const deselectedOpacity = 0.3;

const parseTime = d3.timeParse("%Y-%m-%d");

const songText = document.querySelector("#song-text");
const streamCountText = document.querySelector("#stream-count-text");
const selectedSongText = document.querySelector("#selected-song-text");

let selectedSong;

const highlightSong = d => {
  songText.innerText = d["Track Name"];
  streamCountText.innerText = d.Streams / 1e3 + "k streams";
  if (selectedSong && d["Track Name"] === selectedSong) {
    return;
  }
  d3.selectAll(`circle[songHash="${d["Track Name"].hashCode()}"]`)
    .transition()
    .attr("opacity", highlightOpacity)
    .attr("stroke", "yellow")
    .attr("stroke-width", 3);
};

const selectSong = d => {
  if (selectedSong) {
    unselectSong();
    if (d["Track Name"] === selectedSong) {
      selectedSong = "";
      return;
    }
  }
  selectedSong = d["Track Name"];
  selectedSongText.innerText = "Selected: " + d["Track Name"];
  d3.selectAll(`circle[songHash="${d["Track Name"].hashCode()}"]`)
    .transition()
    .attr("stroke", "orange")
    .attr("stroke-width", 3)
    .attr("opacity", selectedOpacity);
  d3.selectAll(`circle:not([songHash="${d["Track Name"].hashCode()}"])`)
    .transition()
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("opacity", deselectedOpacity);
};

const unhighlightSong = d => {
  songText.innerText = "";
  streamCountText.innerText = "";
  if (selectedSong && d["Track Name"] === selectedSong) {
    return;
  }
  d3.selectAll(`circle[songHash="${d["Track Name"].hashCode()}"]`)
    .transition()
    .attr("stroke", "black")
    .attr("opacity", selectedSong ? deselectedOpacity : defaultOpacity)
    .attr("stroke-width", 2);
};

const unselectSong = () => {
  selectedSongText.innerText = "";
  d3.selectAll("circle")
    .transition()
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("opacity", defaultOpacity);
};

const x = d3
  .scaleTime()
  .domain([new Date(2017, 0, 1), new Date(2018, 0, 8)])
  .range([2.5 * padding, width - padding]);

d3.csv("./country_codes.csv").then(codes => {
  d3.csv("./processed_data.csv").then(data => {
    const regions = d3.map(data, d => d.Region).keys();
    const select = d3.select("#country-select");
    select
      .selectAll("option")
      .data(regions)
      .enter()
      .append("option")
      .attr("value", d => d)
      .text(d => codes.filter(c => c.Code == d.toUpperCase())[0].Country);

    const y = d3.scaleLinear();

    const r = d3.scaleLog().range([5, 20]);

    const color = d3.scaleSequential().interpolator(d3.interpolatePlasma);

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
        .range([height - padding * 1.5, padding * 2])
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

      const newCircles = circles
        .enter()
        .append("circle")
        .attrs(d => {
          return {
            transform: `translate(${x(parseTime(d.Date))}, ${(2 * height) /
              3})`,
            cx: 0,
            cy: 0,
            r: 0,
            "stroke-width": 0,
            stroke: "black",
            song: d["Track Name"],
            URL: d.URL,
            songHash: d["Track Name"].hashCode(),
            opacity: defaultOpacity
          };
        })
        .style("fill", d => color(parseInt(d.Streams)))
        .on("mouseover", highlightSong)
        .on("mouseout", unhighlightSong)
        .on("click", selectSong);

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
          URL: d => d.URL,
          songHash: d => d["Track Name"].hashCode(),
          r: d => r(parseInt(d.Streams)),
          opacity: defaultOpacity,
          stroke: "black"
        })
        .style("fill", d => color(parseInt(d.Streams)));

      if (selectedSong) {
        selectedSong = "";
      }
    };

    select.on("change", render);

    window.addEventListener("resize", render);

    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && selectedSong) {
        unselectSong();
        selectedSong = "";
      }
    });

    render();
  });
});
