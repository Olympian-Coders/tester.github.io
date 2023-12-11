class EventParticipationVis {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.formatDate = d3.timeFormat("%Y");
        this.parseDate = d3.timeParse("%Y");
        this.displayData = data

        this.initVis()

    }

    initVis() {
        let vis = this

        vis.margin = { top: 40, right: 0, bottom: 60, left: 60 };

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right,
            vis.height = 1500 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // create axis
        vis.xScale = d3.scaleTime()
            .range([vis.margin.left, vis.width])
            .domain([d3.min(vis.data, d=> vis.parseDate(d.Year)), d3.max(vis.data, d=> vis.parseDate(d.Year))])


        vis.xAxis = d3.axisTop()
            .scale(vis.xScale)

        vis.xAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0, 50)")

        // init tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'lineTooltip')

        vis.wrangleData()
    }

    wrangleData() {

        let vis = this

        // Extract unique events
        vis.uniqueEvents = Array.from(new Set(vis.data.map(d => d.Sport)));


        // Calculate years offered for each event
        vis.displayData = vis.uniqueEvents.map(sport => {
            const yearsParticipated = vis.data
                .filter(athlete => athlete.Sport === sport)
                .map(athlete => athlete.Year);

            const startYear = vis.parseDate(Math.min(...yearsParticipated));
            const endYear = vis.parseDate(Math.max(...yearsParticipated));


            return { sport, startYear, endYear };
        });

        vis.displayData = vis.displayData.filter(function(d) {
            return d.sport === eventCategorySelection1 || d.sport === eventCategorySelection2 || d.sport === eventCategorySelection3 || d.sport === "Athletics" || d.sport === "Triathlon"
        })

        // Display or use the result
        console.log(vis.displayData)

        //sort data
        vis.displayData.sort((a,b) => {return a.startYear - b.startYear || b.endYear - a.endYear})

        vis.updatevis()
    }

    updatevis() {
        let vis = this


        // adding chart bars
        vis.rects = vis.svg.selectAll("rect")
            .data(vis.displayData)

        vis.rects.exit().remove()

        vis.rects
            .enter()
            .append("rect")
            .merge(vis.rects)
            .transition()
            .duration(800)
            .attr("x", (d) => {
                return vis.xScale(d.startYear)
            })
            .attr("y", (d, i) => 65 + i * 30)
            .attr("width", (d) => {
                let width = vis.xScale(d.endYear) - vis.xScale(d.startYear)
                if(width == 0) {
                    return 2
                }
                return width
            })
            .attr("height", vis.height/52)
            .attr("id", (d) => d.sport)
            .attr("fill", (d) => {
                if(d.sport === "Triathlon" || d.sport === "Athletics") {
                    return "black"
                } else {
                    return "#F5EFEF"
                }
            })


        // adding sport labels to bars
        vis.labels = vis.svg.selectAll("text.sport").data(vis.displayData)

        vis.labels.exit().remove()

        vis.labels
            .enter()
            .append("text")
            .merge(vis.labels)
            .transition().duration(800)
            .text((d) => d.sport)
            .attr("x", (d) => vis.xScale(d.startYear) -4)
            .attr("y", (d, i) => 85 + i * 30)
            .attr("text-anchor", "end")
            .attr("class", "sport")

        // adding year labels
        vis.svg.selectAll("text.endYear").data(vis.displayData)
            .enter()
            .append("text")
            .text((d) => d.endYear)
            .attr("x", (d) => vis.formatDate(vis.xScale(d.startYear)))
            .attr("y", (d, i) => 65 + i * 30)
            .attr("text-anchor", "end")
            .attr("class", "endYear")

        vis.svg.selectAll("text.startYear").data(vis.displayData)
            .enter()
            .append("text")
            .text((d) => d.startYear)
            .attr("x", (d) => vis.formatDate(vis.xScale(d.endYear)))
            .attr("y", (d, i) => 65 + i * 30)
            .attr("text-anchor", "end")
            .attr("class", "startYear")


        vis.xAxisGroup.call(vis.xAxis)
            .style("font-size", "20px");

    }

}