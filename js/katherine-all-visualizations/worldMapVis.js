
class WorldMapVis {

    constructor(parentElement, geoData, medalData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.medalData = medalData;

        this.colors = ["white", "#428A8D"]
        this.initVis();

    }

    initVis() {
        let vis = this;

        // console.log datasets
        console.log("geoData", vis.geoData);
        console.log("medalData", vis.medalData);

        // define vis area variables
        vis.margin = {top: 0, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // initialize drawing area for the map
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`)
            .attr("fill", "white");

        // projection
        vis.projection2 = d3.geoEqualEarth().fitExtent([[2, vis.margin.top + 2], [vis.width - 2, vis.height]], {type: "Sphere"});
        vis.path = d3.geoPath(vis.projection2);

        // define map area
        vis.svg.append("path")
            .datum({type: "Sphere"})
            .attr("fill", "white")
            .attr("stroke", "currentColor")
            .attr("d", vis.path);

        // title of map
        vis.svg.append("g")
            .attr("class", "title")
            .attr("id", "mapTitle")
            .append("text")
            .text("Total Medals by Country")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${vis.width / 2}, 20)`);

        // draw country paths
        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features
        vis.countries = vis.svg.selectAll(".country2")
            .data(vis.world)
            .enter()
            .append("path")
            .attr("class", "countries")
            .attr("class", "country2")
            .attr("d", vis.path)
            .attr("fill", "transparent")
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)

        // initialize tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'worldMapTooltip')

        // Create a linear gradient for the legend
        vis.svg.append("defs").append("linearGradient")
            .attr("id", "legendGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%")
            .selectAll("stop")
            .data([
                { offset: "0%", color: "#FFFFFF" },
                { offset: "100%", color: "#338CFF" }
            ])
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        // Create a legend group
        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width * 2.8 / 4 + 110}, ${vis.height - 50})`);

        //alternative: *2.6 / 4, -67

        // Create a legend rectangle filled with the gradient
        vis.legend.append("rect")
            .attr("width", 160)
            .attr("height", 20)
            .style("fill", "url(#legendGradient)");

        // call wrangleData function
        console.log("WMV: wrangleData function called")
        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        vis.groupedData = d3.group(vis.medalData, d => d.region);
        vis.totalMedalsData = [];

        vis.groupedData.forEach((group, key) => {
            // Calculate the total medals for each region
            let totalMedals = d3.sum(group, d => d.Medal === "Gold" || d.Medal === "Silver" || d.Medal === "Bronze" ? 1 : 0);

            // Push the data to the totalMedalsData array
            vis.totalMedalsData.push({
                region: key,
                TotalMedals: totalMedals
            });

        });

        // call the updateVis function
        console.log("called updateVis function")
        vis.updateVis();

    }

    // TODO: EDIT THIS
    updateBarChart(countryName) {
        // Call the wrangleData function of the BarChart with the selected countryName
        myGoldBarChart.wrangleData(countryName);
        mySilverBarChart.wrangleData(countryName);
        myBronzeBarChart.wrangleData(countryName);
    }

    updateVis() {

        let vis = this;

        // legend
        vis.legendScale = d3.scaleLinear()
            .domain([0, d3.max(vis.totalMedalsData, d => d.TotalMedals)])
            .range([0, 160]);

        // create legend axis
        vis.legendAxis = d3.axisBottom(vis.legendScale)
            .ticks(5)
            .tickFormat(d => d);

        // append axis to legend group
        vis.legend.append("g")
            .attr("transform", "translate(0, 20)")
            .call(vis.legendAxis);

        // define domain of colorScale function
        vis.colorScale = d3.scaleLinear()
            .domain([0, d3.max(vis.totalMedalsData, d => d.TotalMedals)])
            .range(["white", "#338CFF"])

        console.log("vis.totalMedalsData", vis.totalMedalsData)
        console.log("vis.colorScale", vis.colorScale)

        // fill countries with color
        vis.countries.attr("fill", d => {
            vis.countryName = d.properties.name
            let filterInfo = vis.totalMedalsData.filter(country => country.region === vis.countryName)[0]
            if (filterInfo) {
                return vis.colorScale(filterInfo.TotalMedals)
            } else {
                return "white"
            }
        });

        // Add and Update Tooltip
        vis.countries
            .on('mouseover', function(event, d) {
                vis.updateBarChart(d.properties.name);

                vis.countryName = d.properties.name
                let tooltipInfo = vis.totalMedalsData.filter(country => country.region === vis.countryName)[0]

                console.log("TOOLTIP INFO", tooltipInfo)

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                    <p><strong>${tooltipInfo.region}</strong></p>
                    <p>Total Medal Count: ${tooltipInfo.TotalMedals}</p>
                     </div>
                </div>`);
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr("stroke", "darkred")
                    .attr("fill", 'rgba(255,0,0,0.47)');

            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '0.5px')
                    .attr("stroke", "black")
                    .attr("fill", d => {
                        let filterInfo = vis.totalMedalsData.filter(country => country.region === vis.countryName)[0]
                        if (filterInfo) {
                            return vis.colorScale(filterInfo.TotalMedals)
                        } else {
                            return "white"
                        }});
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })



    }

}