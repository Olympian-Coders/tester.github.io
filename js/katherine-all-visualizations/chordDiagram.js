
// TODO: IF VALUE IS ZERO, REMOVE

class ChordDiagram {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.initVis()
    }

    initVis() {

        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.innerRadius = Math.min(vis.width, vis.height) * 0.3;
        vis.outerRadius = vis.innerRadius + 6;

        // init drawing area for the map
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
        //.attr('transform', `translate(${vis.width / 2}, ${vis.height / 2})`);

        vis.names = Array.from(d3.union(vis.data.flatMap(d => [d.source, d.target])));
        vis.index = new Map(vis.names.map((name, i) => [name, i]));
        vis.matrix = Array.from(vis.index, () => new Array(vis.names.length).fill(0));
        for (const {
            source,
            target,
            value
        } of vis.data) vis.matrix[vis.index.get(source)][vis.index.get(target)] += value;

        vis.chord = d3.chordDirected()
            .padAngle(12 / vis.innerRadius)
            .sortSubgroups(d3.descending)
            .sortChords(d3.descending);

        // create arc
        vis.arc = d3.arc()
            .innerRadius(vis.innerRadius)
            .outerRadius(vis.outerRadius);

        vis.ribbon = d3.ribbonArrow()
            .radius(vis.innerRadius - 0.5)
            .padAngle(1 / vis.innerRadius);

        vis.colors = d3.schemeCategory10;

        vis.formatValue = x => `${x.toFixed(0)}B`;

        vis.chords = vis.chord(vis.matrix);

        vis.textId = "text" + Date.now()

        // circle with the labels around it
        // very strange how the translation here works
        vis.svg.append("path")
            .attr("id", vis.textId)
            .attr("class", "circle-labels")
            .attr("fill", "none")
            //.attr("transform", `translate(${vis.width / 2}, ${vis.height / 2})`)
            .attr("d", d3.arc()({
                outerRadius: vis.outerRadius,
                startAngle: 0,
                endAngle: 2 * Math.PI
            }));

        // inner arrows between countries
        vis.svg.append("g")
            .attr("fill-opacity", 0.75)
            .attr("class", "chord-path")
            .selectAll()
            .data(vis.chords)
            .join("path")
            .attr("d", vis.ribbon)
            .attr("fill", d => vis.colors[d.target.index])
            .attr("transform", `translate(${vis.width / 2}, ${vis.height / 2})`)
            .style("mix-blend-mode", "multiply")
            .append("title")
            .text(d => `${vis.names[d.source.index]} owes ${vis.names[d.target.index]} ${vis.formatValue(d.source.value)}`);

        // outer arc
        vis.g = vis.svg.append("g")
            .attr("class", "chord-group")
            .attr("transform", `translate(${vis.width / 2}, ${vis.height / 2})`)
            .selectAll()
            .data(vis.chords.groups)
            .join("g");

        // arc and contour of arc
        vis.g.append("path")
            .attr("d", vis.arc)
            .attr("fill", d => vis.colors[d.index])
            .attr("stroke", "#fff");

        // labels around the circle
        vis.g.append("text")
            .attr("dy", -3)
            .attr("class", "chord-labels")
            .append("textPath")
            .attr("xlink:href", "#" + vis.textId)
            .attr("startOffset", d => d.startAngle * vis.outerRadius)
            .attr("font-size", "10px")
            //.attr("transform", `translate(${vis.width / 2}, ${vis.height / 2})`)
            .text(d => vis.names[d.index]);

        // TODO: NEED TO FIX TOOLTIPS
        // tooltips
        vis.g.append("title")
            .text(d => `${vis.names[d.index]}
            owes ${vis.formatValue(d3.sum(vis.matrix[d.index]))}
            is owed ${vis.formatValue(d3.sum(vis.matrix, row => row[d.index]))}`)
            .attr("class", "chord-tooltip");

        // fetch html for slider
        vis.sliderContainer = document.getElementById("slider-container");
        vis.slider = document.getElementById("slider");

        // Assuming your data variable is accessible here
        vis.minTime = ((d3.min(vis.data, (d) => d.source)));
        vis.maxTime = ((d3.max(vis.data, (d) => d.source)));

        console.log("cd: vis.minTime and vis.maxTime", vis.minTime, vis.maxTime)

        noUiSlider.create(vis.slider, {
            start: [vis.minTime, vis.maxTime],
            connect: true,
            tooltips: true,
            step: 4,
            range: {
                'min': vis.minTime,
                'max': vis.maxTime
            }
        });

        // listener for slider
        vis.slider.noUiSlider.on("update", function (sliderRange, handle, unencoded, tap, positions, noUiSlider) {

            vis.sliderRange = sliderRange
            console.log(vis.sliderRange)

            // call wrangleData() function
            console.log("cd: in wrangleData() function from updateSlider")
            vis.wrangleData()
        });

        // call wrangleData() function
        console.log("cd: in wrangleData() function from normal")
        vis.wrangleData()

    }

    wrangleData() {

        let vis = this;

        // filter data
        vis.filteredData = vis.data.filter((d) => d.source >= vis.sliderRange[0] && d.source <= vis.sliderRange[1]);
        console.log("vis.filteredData", vis.filteredData)

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        // Remove existing elements before updating
        vis.svg.selectAll(".circle-labels, .chord-path, .chord-group, .chord-labels, .chord-tooltip").remove();

        vis.names = Array.from(d3.union(vis.filteredData.flatMap(d => [d.source, d.target])));
        vis.index = new Map(vis.names.map((name, i) => [name, i]));
        vis.matrix = Array.from(vis.index, () => new Array(vis.names.length).fill(0));
        for (const { source, target, value } of vis.filteredData) vis.matrix[vis.index.get(source)][vis.index.get(target)] += value;

        // circle for the labels on the outside to appear on
        vis.svg.append("path")
            .attr("class", "circle-labels")
            .attr("id", vis.textId)
            .attr("fill", "none")
            .attr("d", d3.arc()({
                outerRadius: vis.outerRadius,
                startAngle: 0,
                endAngle: 2 * Math.PI
            }));

        // inner arrows between countries
        vis.svg.append("g")
            .attr("class", "chord-path")
            .attr("fill-opacity", 0.75)
            .selectAll()
            .data(vis.chords)
            .join("path")
            .attr("d", vis.ribbon)
            .attr("fill", d => vis.colors[d.target.index])
            .attr("transform", `translate(${vis.width / 2}, ${vis.height / 2})`)
            .style("mix-blend-mode", "multiply")
            .append("title")
            .text(d => `${vis.names[d.source.index]} owes ${vis.names[d.target.index]} ${vis.formatValue(d.source.value)}`);

        // create group for outer arc and labels around the circle
        vis.g = vis.svg.append("g")
            .attr("class", "chord-group")
            .attr("transform", `translate(${vis.width / 2}, ${vis.height / 2})`)
            .selectAll()
            .data(vis.chords.groups)
            .join("g");

        // outer arc
        vis.g.append("path")
            .attr("d", vis.arc)
            .attr("fill", d => vis.colors[d.index])
            .attr("stroke", "#fff");

        // labels around the circle
        vis.g.append("text")
            .attr("class", "chord-labels")
            .attr("dy", -3)
            .append("textPath")
            .attr("xlink:href", "#" + vis.textId)
            .attr("startOffset", d => d.startAngle * vis.outerRadius)
            .attr("font-size", "10px")
            .text(d => vis.names[d.index]);

        // tooltips
        vis.g.append("title")
            .attr("class", "chord-tooltip")
            .text(d => `${vis.names[d.index]}
            owes ${vis.formatValue(d3.sum(vis.matrix[d.index]))}
            is owed ${vis.formatValue(d3.sum(vis.matrix, row => row[d.index]))}`);

    }

}