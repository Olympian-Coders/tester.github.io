
/*
 * BarChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the bar charts
 * @param _data						-- the dataset 'household characteristics'
 * @param _config					-- variable from the dataset (e.g. 'electricity') and title for each bar chart
 */

class BarChart {

    constructor(parentElement, data, config) {
        this.parentElement = parentElement;
        this.data = data;
        this.config = config;

        this.initVis();

    }

    /*
     * Initialize visualization (static content; e.g. SVG area, axes)
     */

    initVis() {
        let vis = this;

        vis.margin = {top: 10, right: 50, bottom: 20, left: 135};

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");
        console.log("Svg drawing area created.")

        // Create scale for x-axis
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width])

        // Create scale for y-axis
        vis.yScale = d3.scaleBand()
            .range([vis.height, 0])
            .padding(0.1)

        vis.xAxis = d3.axisBottom()
            .scale(vis.xScale);

        vis.yAxis = d3.axisLeft()
            .scale(vis.yScale);

        // Append axes to svg area
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")")

        vis.svg.append("g")
            .attr("class", "y-axis axis")

        // call wrangle data function
        console.log("BARCHART: Wrangle data function called.")
        vis.wrangleData();
    }

    // if countryName == None
    wrangleData(countryName) {
        let vis = this;

        // filter data by countryName
        vis.filteredData = vis.data.filter(d => d.region === countryName && d[vis.config] >= 1);
        console.log("vis.filteredData: ", vis.filteredData);

        // group data by Sport and count leaves
        vis.countBySport = d3.rollup(vis.filteredData, leaves => leaves.length, d => d.Sport);
        console.log("countBySport:", vis.countBySport);

        // transform countBySport into an array
        vis.countArray = Array.from(vis.countBySport, ([key, value]) => ({ key, value }));

        // sort the array in descending order by 'value'
        vis.countArray.sort((a, b) => b.value - a.value);

        // take only the top 5 entries
        vis.displayData = vis.countArray.slice(0, 5);

        // Get the medal type from the config
        vis.medalType = vis.config.replace("_medal", "");

        // edge case: if countryName is null
        countryName = countryName ?? '';

        const colorMap = {
            gold: "#CC9933",  // Color for gold medal
            silver: "#C0C0C0",  // Color for silver medal
            bronze: "#bb8141"   // Color for bronze medal
        };

        // Capitalize the first letter
        vis.medalType = vis.medalType.charAt(0).toUpperCase() + vis.medalType.slice(1);

        // Get the color from the map based on medalType or id
        const color = colorMap[vis.medalType.toLowerCase()];

        // Update the content of the HTML text element with the id "${vis.medalType}-title"
        vis.titleElement = document.getElementById(`${vis.medalType}-title`);
        vis.titleElement.innerHTML = `${countryName !== '' ? countryName + ': ' : ''}Top 5 Sports by <span style="color: ${color}; font-weight: bold;">${vis.medalType} Medal Count</span>`;

        // update the visualization
        vis.updateVis();
    }

    /*
     * The drawing function - should use the D3 update sequence (enter, update, exit)
     */

    updateVis() {
        let vis = this;

        // Find maxCount (to update the x-axis domain)
        let maxCount = d3.max(vis.displayData, d => d.value);

        // Update the x-axis domain
        vis.xScale.domain([0, maxCount]);
        console.log("X domain updated");

        // Update the y-axis domain
        vis.yScale.domain(vis.displayData.map(d => d.key));
        console.log("Y domain updated");

        // Refine data to appear in the bar chart
        let bars = vis.svg.selectAll("rect")
            .data(vis.displayData);

        // Draw rectangles using the D3 update sequence (enter, update, exit)
        bars.enter()
            .append("rect")
            .merge(bars)
            .attr("fill", "black")
            .attr("width", d => vis.xScale(d.value))
            .attr("height", vis.yScale.bandwidth())
            .attr("y", d => vis.yScale(d.key))
            .attr("x", 2)
            .transition()
            .duration(400);

        bars.exit().remove();

        // (3) Draw labels using the D3 update sequence (enter, update, exit)
        let labels = vis.svg.selectAll(".bar-label")
            .data(vis.displayData);

        // Make labels enter
        labels.enter()
            .append("text")
            .attr("class", "bar-label")
            .merge(labels)
            .attr("x", d => vis.xScale(d.value) + 10)
            .attr("y", d => vis.yScale(d.key) + vis.yScale.bandwidth() / 2 + 4)
            .text(d => d.value)
            .attr("font-size", "10px");

        // Make labels exit
        labels.exit().remove();

        // Update the axes
        vis.svg.select(".y-axis")
            .call(vis.yAxis)
            .transition()
            .duration(400);
    }

}
