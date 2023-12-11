class bubbleViz {

    // constructor method to initialize Timeline object
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        // parse date method
        this.parseDate = d3.timeParse("%Y");

        this.initVis()
    }

    initVis() {
        let vis = this;

        // Specify the dimensions of the chart.
        vis.width = 650;
        vis.height = 650;
        vis.margin = 10;
        vis.name = d => (d?.Team ? d.Team.split(".").pop() : "");
        vis.group = d => (d?.Team ? d.Team : "");
        vis.names = d => name(d).split(/(?=[A-Z][a-z])|\s+/g).filter(Boolean);
        vis.format = d3.format(",d");

        // Define your custom colors for each circle.
        vis.customColors = ['#0081C8', '#FCB131', '#00A651', '#EE334E', '#CC1421', '#CCC521', '#C75C61', '#3A48E4', '#A1631B', '#611BA1', '#61E2A1'];

        // Create the pack layout.
        vis.pack = d3.pack()
            .size([vis.width - vis.margin * 2, vis.height - vis.margin * 2])
            .padding(7);

        // Create the SVG container.
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("viewBox", [-vis.margin, -vis.margin, vis.width, vis.height])
            .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
            .attr("text-anchor", "middle")
            .append("g");

        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'mapTooltip');

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        let jselectedCategory = document.getElementById('jcategorySelector3').value;

        vis.newData = vis.data.filter(d => d.Year === jselectedCategory);
        console.log("newData", vis.newData)

        vis.updateVis()

    }

    updateVis() {
        let vis = this;

        vis.root = vis.pack(d3.hierarchy({ children: vis.newData }).sum(d => d.TotalFemale));

        vis.node = vis.svg.selectAll("g")
            .data(vis.root.leaves())
            .join("g")
            .attr("transform", d => `translate(${d.x},${d.y})`);

        vis.node.append("title")
            .text(d => `${d.data.id}\n${vis.format(d.value)}`);

        vis.node.selectAll("circle").remove();
        vis.node.append("circle")
            .attr("fill-opacity", 0.9)
            .attr("fill", (d, i) => vis.customColors[i % vis.customColors.length]) // Use the custom color array
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("r", d => d.r )

            .on('mouseover', function (event, d) {
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                         <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 10px">
                             <h3>${d.data.Team}</h3>
                            <p>Number of Female Athletes: ${d.value}</p>
                         </div>`);
            })

            .on('mouseout', function (event, d) {
                d3.select(this)
                    .attr('stroke-width', '0px')

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });

        vis.node.selectAll("text").remove();

        vis.node.append("text")
            .attr("dy", ".3em")
            .style("text-anchor", "middle")
            .attr("fill", "black")
            .text(d => vis.name(d.data))
            .style("fill", "black")
            .style("font-size", "14px");

        vis.node.append("text")
            .attr("dy", "1.5em")
            .style("text-anchor", "middle")
            .attr("fill", "black")
            .text(d => vis.format(d.value))
            .style("font-size", "14px");
    }
}