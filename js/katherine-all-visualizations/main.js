/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// TODO: Replace selectedCategory by selectedYear everywhere in the code.

// initialize global variables, switches, helper functions
let myMapVis;
let myChordDiagram;
let nlBubble;
let areaChart;
let timeline;
let myEventParticipationMap;
let myLineGraphMapC;
let myWomansInfoMap;

// carly
let eventCategorySelection1 = document.getElementById('eventCategorySelector1').value;
let eventCategorySelection2 = document.getElementById('eventCategorySelector2').value;
let eventCategorySelection3 = document.getElementById('eventCategorySelector3').value;

// carly
function participationCategoryChange1() {
    eventCategorySelection1 = document.getElementById('eventCategorySelector1').value;
    eventCategorySelection2 = document.getElementById('eventCategorySelector2').value;
    eventCategorySelection3 = document.getElementById('eventCategorySelector3').value;
    myEventParticipationMap.wrangleData()
}

// julie
let jSelectedCategory=  document.getElementById('jcategorySelector3').value;
let selectedCategory =  document.getElementById('categorySelector').value;


// define function that detects category changes
function categoryChange() {
    selectedCategory =  document.getElementById('categorySelector').value;
    myMapVis.wrangleData();
}

// julie - helper function for bubble graph
function jcategoryChange3() {
    nlBubble.wrangleData();
}

// load data using promises (promises are a way to store the data of multiple csv files all at once)
let promises = [
    d3.csv("data/oly_merged.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"),
    d3.csv("data/proportions_df_oly.csv"),
    d3.csv("data/result_top_10_teams_per_year.csv"),
    d3.csv("data/maleFemaleandAll_counts.csv"),
    d3.csv("data/oly.csv"),
    d3.csv("data/womansInfoNew.csv"),
    d3.csv("data/medals.csv"),
    d3.json("data/countries-50m.json")
];

function convertColumnType(data, columnName, targetType) {
    data.forEach(function (d) {
        // Convert the column to the desired data type
        d[columnName] = targetType(d[columnName]);
    });
}
Promise.all(promises)
    .then(function(data) {
        // Convert the desired column to the desired data type
        convertColumnType(data[2], 'source', Number);
        convertColumnType(data[2], 'target', Number);

        data[4] = prepareDataForStudents(data[4]);

        data[1].objects.countries.geometries.forEach(function(geometry) {
            var name = geometry.properties.name;
            if (name === "United States of America") {
                geometry.properties.name = "USA";
            }
            if (name === "United Kingdom") {
                geometry.properties.name = "UK";
            }
        });

        data[8].objects.countries.geometries.forEach(function(geometry) {
            var name = geometry.properties.name;
            if (name === "United States of America") {
                geometry.properties.name = "USA";
            }
            if (name === "United Kingdom") {
                geometry.properties.name = "UK";
            }
        });

        // Initialize graphs
        initFirstGraph(data);
    })
    .catch(function(err) {
        console.log(err);
    });

// initMainPage
function initFirstGraph(allDataArray) {

    let nationsData = []
    let athleteData = []

    //wrangle data for the line graphs
    const uniqueYears = Array.from(new Set(allDataArray[5].map(d => d.Year)));

    // Calculate total number of nations for each year
    nationsData = uniqueYears.map(year => {
        const totalNations = new Set(allDataArray[5].filter(athlete => athlete.Year === year).map(athlete => athlete.NOC)).size;

        return {year, totalNations};
    });

    // Calculate the total number of athletes for each year
    athleteData = uniqueYears.map(year => {
        const totalAthletes = allDataArray[5].filter(athlete => athlete.Year === year).length;

        return {year, totalAthletes};
    });

    // sort each dataset
    nationsData.sort((a, b) => {
        return a.year - b.year
    })
    athleteData.sort((a, b) => {
        return a.year - b.year
    })

    // transform date values
    let parseDate = d3.timeParse("%Y")
    nationsData.forEach((d) => {
        d.year = parseDate(d.year)
    })
    athleteData.forEach((d) => {
        d.year = parseDate(d.year)
    })

    // create event handler for participation line graphs
    let eventHandler = {
        bind: (eventName, handler) => {
            document.body.addEventListener(eventName, handler);
        },
        trigger: (eventName, extraParameters) => {
            document.body.dispatchEvent(new CustomEvent(eventName, {
                detail: extraParameters
            }));
        }
    }

    // carly - instances
    myLineGraphMapC = new athletesParticipatingLineVis("athletesParticipatingLineDiv", athleteData, eventHandler)
    myLineGraphMapC23 = new nationsParticipatingLineVis("nationsParticipatingLineDiv", nationsData)
    myEventParticipationMap = new EventParticipationVis("eventParticipationDiv", allDataArray[5])
    myWomansInfoMap = new WomansInfoVis("womensInfoDiv", allDataArray[6])

    // helper function - event handler
    eventHandler.bind("selectionChanged", function (event) {
        let rangeStart = event.detail[0];
        let rangeEnd = event.detail[1];
        myLineGraphMapC23.onSelectionChange(rangeStart, rangeEnd);
    })

    // print data to console
    console.log("allDataArray", allDataArray);

    // instances - katherine
    myMapVis = new MapVis('mapDiv', allDataArray[0], allDataArray[1])
    //myChordDiagram = new ChordDiagram('chordDiv', allDataArray[2]);
    myWorldMapVis = new WorldMapVis("world-map-vis", allDataArray[8], allDataArray[7])
    myGoldBarChart = new BarChart("gold-bar-chart", allDataArray[7], "gold_medal")
    mySilverBarChart = new BarChart("silver-bar-chart", allDataArray[7], "silver_medal")
    myBronzeBarChart = new BarChart("bronze-bar-chart", allDataArray[7], "bronze_medal")

    // instances - julie
    nlBubble = new bubbleViz('bubbleChartContainer', allDataArray[3])
    areaChart = new StackedAreaChart("stacked-area-chart", allDataArray[4]);

    myWorldMapVis.updateBarChart(null);

    // timeline visualization instance
    let timelineData = allDataArray[4].map(d => ({ Year: d.Year, Expenditures: calculateTotalExpenditures(d) }));
    timeline = new Timeline("timeline", timelineData);

    // don't think these below two lines are necessary
    timeline.initVis();
    areaChart.initVis();

}

/* * * * * * * * * * * * * *
*     HELPER FUNCTIONS     *
* * * * * * * * * * * * * */

function brushed() {
    let selection = d3.brushSelection(d3.select(".Jbrush").node());
    areaChart.x.domain(selection.map(timeline.x.invert));
    areaChart.wrangleData();
}

// helper function to calculate total expenditures
function calculateTotalExpenditures(d) {
    return d.MaleCount + d.FemaleCount;
}

// helper function for preparing stacked bar chart data
function prepareDataForStudents(data) {
    let parseDate = d3.timeParse("%Y");

    // Convert Pence Sterling (GBX) to USD and parse years to date objects
    data.forEach(d => {
        d.MaleCount = parseFloat(d.MaleCount);
        d.FemaleCount = parseFloat(d.FemaleCount);
        d.Year = parseDate(d.Year.toString());
    });

    return data;
}
