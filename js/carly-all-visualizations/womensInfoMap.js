class WomansInfoVis {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.formatDate = d3.timeFormat("%Y");
        this.parseDate = d3.timeParse("%Y");

        this.initVis()

    }

    initVis() {
        let vis = this;

        vis.margin = {top: 40, right: 20, bottom: 20, left: 40};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 50

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.margin.left + vis.width + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);


        // create axis scales
        vis.xScale = d3.scaleTime()
            .domain([vis.parseDate(1896), vis.parseDate(2024)])
            .range([0, vis.width])

        // initialize axis
        vis.xAxis = d3.axisBottom()
            .scale(vis.xScale)

        vis.xAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0, 20)")

        vis.xAxisGroup
            .call(vis.xAxis);

        // add tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'timelineTooltip')

        vis.circles = vis.svg.selectAll("circle")
            .data(vis.data, d => d.name)

        // add circle markers to timeline
        vis.circles.enter()
            .append('circle')
            .attr("id", (d) => "div" + d.participation )
            .attr("cx", (d) => {
                return vis.xScale(vis.parseDate(d.participation))
            })
            .attr("cy", 5)
            .attr("fill", "#F5EFEF")
            .attr("r", "10")
            .on("mouseover", function(event, d) {
                // resets color of markers
                vis.data.forEach((d) => {
                    d3.select(`#div${d.participation}`)
                        .attr("fill", "#F5EFEF")
                })
                // changes color of selected marker
                d3.select(`#div${d.participation}`)
                    .attr("fill", "black")
                vis.addInfo(d)
            })


        vis.wrangleVis()
    }

    addInfo(object) {
        // updates the info displayed
        document.getElementById("womensInfoPic").innerHTML = "<img src=" + object.image + " width=" + 300 + "height=" + 300 + ">"

        document.getElementById("womensInfoParagraph").innerHTML = "<p>" + object.fact + "</p>"
    }

    wrangleVis() {
        let vis = this;

        //not needed for now

        vis.updateVis()
    }

    updateVis() {
        let vis = this

        // also not needed

    }
}