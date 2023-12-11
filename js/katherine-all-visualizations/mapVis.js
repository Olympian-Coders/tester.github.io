
// define the constructor
class MapVis {

    constructor(parentElement, olympicData, geoData) {
        this.parentElement = parentElement;
        this.olympicData = olympicData;
        this.geoData = geoData;

        this.initVis()
    }

    initVis() {

        let vis = this;

        // initialize variable names
        vis.margin = {top: 10, right: 10, bottom: 10, left: 10};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // initialize drawing area for the map
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // Append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', 'tooltip')
            .attr('id', 'mapToolTip')

        // create a group for the map
        vis.mapGroup = vis.svg.append('g')
            .attr('class', 'map');

        // generate the projection of the map
        vis.projection = d3.geoOrthographic()
            .scale(230)
            .translate([vis.width / 2, vis.height / 2])

        // generate the path using the projection
        vis.path = d3.geoPath()
            .projection(vis.projection);

        // add the blue for the water in the world
        vis.svg.append("path")
            .datum({type: "Sphere"})
            .attr("class", "graticule")
            .attr('fill', '#ADDEFF')
            .attr("stroke", "rgba(129,129,129,0.35)")
            .attr("d", vis.path);

        // draw the world
        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features

        // draw the countries
        vis.countries = vis.svg.selectAll(".country")
            .data(vis.world)
            .enter().append("path")
            .attr('class', 'country')
            .attr("d", vis.path)

        // make the globe rotate
        let m0,
            o0;

        vis.svg.call(
            d3.drag()
                .on("start", function (event) {

                    let lastRotationParams = vis.projection.rotate();
                    m0 = [event.x, event.y];
                    o0 = [-lastRotationParams[0], -lastRotationParams[1]];
                })
                .on("drag", function (event) {
                    if (m0) {
                        let m1 = [event.x, event.y],
                            o1 = [o0[0] + (m0[0] - m1[0]) / 4, o0[1] + (m1[1] - m0[1]) / 4];
                        vis.projection.rotate([-o1[0], -o1[1]]);
                    }

                    // Update the map
                    vis.path = d3.geoPath().projection(vis.projection);
                    d3.selectAll(".country").attr("d", vis.path)
                    d3.selectAll(".graticule").attr("d", vis.path)
                    initFirstGraph(allDataArray)
                }))

        // call wrangleData function
        vis.wrangleData()
    }

    wrangleData() {
        let vis = this;
        console.log("In wrangleData() function.")

        vis.selectedCategory = document.getElementById('categorySelector').value;

        // subset the data by year based on the selectedCategory
        vis.selectedYearData = vis.olympicData.filter(d => d.Year === vis.selectedCategory);
        console.log("selectedYearData", vis.selectedYearData)

        // subset the data further to get the countries who participated in the olympics that year
        vis.countryParticipation = Array.from(d3.group(vis.selectedYearData, d => d.region), ([key, value]) => ({
            key,
            value
        }));
        console.log("countryParticipation", vis.countryParticipation);

        // call the updateVis() function
        console.log("called the updateVis() function")
        vis.updateVis()

    }

    updateVis() {
        let vis = this;

        // fill countries in red if selected, if not in white
        vis.countries.attr("fill", d => {
            let countryName = d.properties.name;

            let isParticipating = vis.countryParticipation.some(country => country.key === countryName);

            return isParticipating ? "red" : "white";
        }).attr("stroke", "rgba(211, 211, 211, 0.3)")
            .attr("stroke-width", 1);

        vis.showOlympics()

    }

    showOlympics() {
        let vis = this;

        // set html elements
        let yearData = vis.selectedYearData.find(entry => entry.Year === vis.selectedCategory);
        let hostCityElement = document.getElementById("host-city");
        let numNationsElement = document.getElementById("num-nations");
        let numAthletesElement = document.getElementById("num-athletes");

        // deal with edge case, 1916 and 1940 when the olympics were cancelled
        if (vis.selectedCategory === "1916" || vis.selectedCategory === "1940") {
            hostCityElement.innerText = numNationsElement.innerText = numAthletesElement.innerText = "N/A";
        } else {
            hostCityElement.innerText = yearData.City;
            numNationsElement.innerText = vis.countryParticipation.length;
            numAthletesElement.innerText = new Set(vis.selectedYearData.map(d => d.ID)).size;
        }

    }
}



