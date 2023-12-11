class athletesParticipatingLineVis {

    constructor(parentElement, data, eventHandler) {
        this.parentElement = parentElement;
        this.data = data
        this.parseDate = d3.timeParse("%Y");
        this.formatDate = d3.utcFormat("%Y")
        this.eventHandler = eventHandler
        this.displayData = data

        this.initVis()
    }

    initVis() {

        let vis = this

        vis.margin = {top: 40, right: 20, bottom: 20, left: 40};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 300

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.margin.left + vis.width + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add title
        vis.svg.append('g')
            .attr('class', 'title bar-title')
            .append('text')
            .text("Steady Increase in Athlete Participation")
            .attr('transform', `translate(${vis.width / 2}, 0)`)
            .attr('text-anchor', 'middle');

        // create axis scales
        vis.xScale = d3.scaleTime()
            .range([0, vis.width])

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0])


        // initialize axis
        vis.xAxis = d3.axisBottom()
            .scale(vis.xScale)

        vis.yAxis = d3.axisLeft()
            .scale(vis.yScale)

        vis.yAxisGroup = vis.svg.append("g")
            .attr("class", "y-axis axis")
            .attr("transform", "translate(0,0)")

        vis.xAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")")

        // init brush component
        vis.currentBrushRegion = null;
        vis.brush = d3.brushX()
            .extent([[0,0],[vis.width, vis.height]])
            .on("brush", function(event){
                // User just selected a specific region
                vis.currentBrushRegion = event.selection;
                vis.currentBrushRegion = vis.currentBrushRegion.map(vis.xScale.invert);

                // 3. Trigger the event 'selectionChanged' of our event handler
                vis.eventHandler.trigger("selectionChanged", vis.currentBrushRegion);
            });

        // Append brush component here
        // *** TO-DO ***
        vis.brushGroup = vis.svg.append("g")
            .attr("class", "brush")
            .call(vis.brush)
            .attr("clip-path", "url(#clip)");


        // init tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'lineTooltip')

        console.log("INIT VIZ CARLY")
        vis.wrangleData()

    }

    wrangleData() {
        let vis = this

        // if(selectedCategoryC != "All") {
        //     console.log(selectedCategoryC)
        //     vis.displayData = vis.displayData.filter(function(d) {
        //         console.log(d)
        //         return d.sport == selectedCategoryC;
        //     })
        //     console.log(vis.displayData)
        // } else (
        //     vis.displayData = vis.displayData
        // )

        vis.updateVis()

    }

    updateVis() {
        let vis = this

        // call brush
        vis.brushGroup.call(vis.brush)

        // update Axes
        vis.xScale.domain([d3.min(vis.displayData, d=> d.year), d3.max(vis.displayData, d=> d.year)])
        vis.yScale.domain([0, d3.max(vis.displayData, d=> d.totalAthletes)])


        let line = d3.line()
            .x(function(d) {return vis.xScale(d.year)})
            .y(function(d) {return vis.yScale(d.totalAthletes) })

        let lines = vis.svg.append("path")
            .attr("class", "line")

        vis.svg.select(".line")
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("d", line(vis.displayData))

        // add dots
        vis.circles = vis.svg.selectAll("circle")
            .data(vis.displayData)

        vis.circles.exit().remove()

        vis.circles.enter().append("circle")
            .merge(vis.circles)
            .attr("cx", (d) => vis.xScale(d.year))
            .attr("cy", (d) => vis.yScale(d.totalAthletes))
            .attr("r", 5)
            .attr("fill", "green")
            .on("mouseover", function(event, d) {
                console.log(d)
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                         <div style="border: thin solid grey; border-radius: 5px; background: whitesmoke; padding: 20px">
                             <h8>${vis.formatDate(d.year)}</h8></br>
                             <h8> Number of Athletes Participating: ${d.totalAthletes}</h8>      
                         </div>`)
            })
            .on("mouseout", function(event, d) {
                vis.tooltip
                    .style("opacity", 0)
            })


        //circles.on("click", function(event, d) {
        //    console.log("happy")
        //    showEdition(d)
        //})


        // update/make axes
        vis.yAxisGroup
            .transition()
            .duration(800)
            .call(vis.yAxis);
        vis.xAxisGroup
            .transition()
            .duration(800)
            .call(vis.xAxis);


    }

}