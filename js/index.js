//获取数据
// https://observablehq.com/@sfu-iat355/intro-to-leaflet-d3-interactivity
class ParkMap {
  constructor() {
    this.initRadiosData(); //编辑数据筛选器里的信息,并与左侧数据联动
    this.initMap();
    this.initInfo();
    this.addEvent();
    this.showInfosNumber = 6;
  }
  initInfo() {
    this.info = d3.select("#info");
    this.info
      .append("div")
      .html("Carleton University(Demo location)")
      .attr("class", "demoLocation");
    this.tops = this.info.append("div").attr("class", "topDiv");
    // this.refreshButton = this.info
    //   .append("div")
    //   .attr("class", "RefreshDiv")
    //   .append("button")
    //   .attr("class", "RefreshButton")
    //   .html("Refresh");
  }
  async initMap() {
    //获取数据
    await this.getGeoJson();
    //设置宽高
    let width = d3.select("#map").node().offsetWidth;
    let height = d3.select("#map").node().offsetHeight;
    d3.select("#map").attr("width", width).attr("height", height);

    //初始化地图
    this.map = L.map("map").setView(
      [45.38762640962469, -75.69567687726531],
      13
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    //initialize svg to add to map
    L.svg({ clickable: true }).addTo(this.map); // we have to make the svg layer clickable
    const overlay = d3.select(this.map.getPanes().overlayPane);
    const svg = overlay.select("svg").attr("pointer-events", "auto");

    this.svg = svg;
    this.width = width;
    this.height = height;

    this.infoData = this.park;
    this.drawMap(this.infoData);
    this.addLeftLabels(this.infoData);
    this.addAdvanceFilter();
  }

  async getGeoJson() {
    let ottawa = await d3.json("./data/ottawa.geojson.json");
    let park = await d3.csv("./data/data.csv");

    //计算每个点距离学校的距离

    park.forEach((d) => {
      d.distance = calcDistance(
        -75.69567687726531,
        45.38762640962469,
        +d.X,
        +d.Y
      );
    });

    park.sort((a, b) => a.distance - b.distance);

    //TODO增加一个学校的位置的数据
    park.push({
      Sheet: "university",
      X: -75.69567687726531,
      Y: 45.38762640962469,
    });
    this.ottawa = ottawa;
    this.park = park;

    console.log(ottawa, park);
  }

  async drawMap(data) {
    let map = this.map;
    let svg = this.svg;

    this.x = (d) => map.latLngToLayerPoint([+d.Y, +d.X]).x;
    this.y = (d) => map.latLngToLayerPoint([+d.Y, +d.X]).y;

    let Dots = svg
      .selectAll(".images")
      .data(data)
      .join("image")
      .attr("class", "images")
      .attr("x", this.x)
      .attr("y", this.y)
      .attr("width", 35)
      .attr("height", 35)
      .attr("href", (d) => `./images/${d.Sheet}.png`);

    const update = () => Dots.attr("x", this.x).attr("y", this.y);

    map.on("zoomend", update);
  }

  addLeftLabels() {
    let data = this.infoData//.slice(0, this.showInfosNumber);

    this.updateLabels(data);

    this.topLocationsEvent();
  }
  updateLabels(data) {
    let tops = this.tops
      .selectAll(".tops")
      .data(data)
      .join("div")
      .attr("class", "tops");
    tops.selectAll("*").remove();
    tops.append("img").attr("src", (d) => `./images/${d.Sheet}.png`);
    tops
      .append("span")
      .text((d) =>
        d["Park Name"] === ""
          ? d["Address"].replaceAll(", Ottawa", "")
          : d["Park Name"]
      );
    tops.append("span").text((d) => d3.format(".2f")(d.distance) + "KM");
    tops.append("button").attr("class", "trangle").html("&#8711;");
    let details = tops
      .datum((d) => d)
      .append("div")
      .attr("class", "details")
      .style("display", "none");

    //TODO这里根据不同的运动属性-显示不同的信息,if判断,分开写
    let sheet = details.datum().Sheet;
    let tempdiv;
    //如果是Tennis
    if (sheet === "Tennis") {
      //surfase - color
      details
        .append("span")
        .html((d) => `Surface Colour : ${d["SURFACE_COLOUR"]}`);

      tempdiv = details.append("span").attr("class", "detailsIcon");
      tempdiv.append("span").html(`Lights`);
      tempdiv
        .append("img")
        .attr("src", (d) =>
          d.Lights === "No" ? "./images/no-f.png" : "./images/yes-f.png"
        );
      details.append("span").attr("class", "divider");
      details.append("span").html((d) => `Court Type : ${d["COURT_TYPE"]}`);
      tempdiv = details.append("span").attr("class", "detailsIcon");
      tempdiv.append("span").html(`Accessible`);
      tempdiv
        .append("img")
        .attr("src", (d) =>
          d.ACCESSIBLE === "No" ? "./images/no-f.png" : "./images/yes-f.png"
        );
    } else if (sheet === "Rinks") {
      details.append("span").html((d) => `Facility : ${d["Facility"]}`);
      details.append("span").html((d) => `Rink Type : ${d["Rink Type"]}`);
      details.append("span").html((d) => `Boards Type : ${d["Boards Type"]}`);
      tempdiv = details.append("span").attr("class", "detailsIcon");
      tempdiv.append("span").html(`Toilet`);
      tempdiv
        .append("img")
        .attr("src", (d) =>
          d.Toilet === "No" ? "./images/no-f.png" : "./images/yes-f.png"
        );
      details.append("span").attr("class", "divider");
      tempdiv = details.append("span").attr("class", "detailsIcon");
      tempdiv.append("span").html(`Lights`);
      tempdiv
        .append("img")
        .attr("src", (d) =>
          d.Lights === "No" ? "./images/no-f.png" : "./images/yes-f.png"
        );
    } else if (sheet === "Sledding") {
      details.append("span").html((d) => `Assessment : ${d["ASSESSMENT"]}`);
      tempdiv = details.append("span").attr("class", "detailsIcon");
      tempdiv.append("span").html(`Assessment`).attr("class", "detailsIcon");
      tempdiv
        .append("img")
        .attr("src", (d) =>
          d.ACCESSIBLE === "No" ? "./images/no-f.png" : "./images/yes-f.png"
        );
      details.append("span").attr("class", "divider");
    } else if (sheet === "Swimming") {
      details.append("span").html((d) => `Pool Type : ${d["POOL TYPE"]}`);
      tempdiv = details.append("span").attr("class", "detailsIcon");
      tempdiv.append("span").html(`Accessible`);
      tempdiv
        .append("img")
        .attr("src", (d) =>
          d.ACCESSIBLE === "No" ? "./images/no-f.png" : "./images/yes-f.png"
        );
      details.append("span").attr("class", "divider");
    } else if (sheet === "Skateboard") {
      details.append("span").html((d) => `Facility : ${d["Facility"]}`);
      details
        .append("span")
        .html((d) => `Facility Type : ${d["FACILITY_TYPE"]}`);
      tempdiv = details.append("span").attr("class", "detailsIcon");
      tempdiv.append("span").html(`Accessible`);
      tempdiv
        .append("img")
        .attr("src", (d) =>
          d.ACCESSIBLE === "No" ? "./images/no-f.png" : "./images/yes-f.png"
        );
      details.append("span").attr("class", "divider");
    }
    details
      .append("span")
      .html((d) => `Address: ${d.Address}`)
      .attr("class", "address");
  }
  addEvent() {
    //显示advanceFilter
    d3.select(".uprightFilter").on("click", () => {
      let status = d3.select(".advanceFilter").style("display");
      d3.select(".advanceFilter")
        .style("display", status === "none" ? null : "none")
        .style("top", "100px")
        .style("left", "200px");
    });

    //点击图片进行筛选
    let images = ["Tennis", "Sledding", "Skateboard", "Swimming", "Rinks"];
    images.forEach((cate) => {
      d3.select(`.${cate}`).on("click", (e) => {
        //获取颜色
        let color = d3.select(`.${cate}`).style("background-color");
        //第二次点击恢复颜色
        d3.selectAll(`.title img`).style("background-color", null);
        d3.select(e.target).style("background-color", color);

        if (color === "rgba(0, 0, 0, 0)") {
          //选择图片变色
          d3.select(`.${cate}`).style("background-color", "#ff00ff");
          //切换数据
          this.infoData = this.park.filter((d) => d.Sheet === cate);
          //重画地图
          this.drawMap(this.infoData);
          //重新渲染tOP6
          this.addLeftLabels(this.infoData);
        } else {
          d3.select(`.${cate}`).style("background-color", "rgba(0, 0, 0, 0)");
          //重画地图
          this.infoData = this.park;
          this.drawMap(this.infoData);
          //重新渲染tOP6
          this.addLeftLabels(this.infoData);
        }
      });
    });

    //点击按钮刷新数据
    this.refreshButton.on("click", () => {
      //TODO 再添加5条数据
      this.showInfosNumber += 6;
      this.addLeftLabels();
    });
  }

  topLocationsEvent() {
    //显示Top的详细地点
    d3.selectAll(".trangle").on("click", (e, d) => {
      let div = d3.select(e.target).select(function () {
        return this.nextSibling;
      });

      let status = div.style("display");
      div.style("display", status === "none" ? null : "none");
    });
  }
  addAdvanceFilter() {
    //添加更多筛选的modal
    let advanceFilter = d3
      .select("#viz")
      .append("section")
      .attr("class", "advanceFilter")
      .style("width", "1200px")
      .style("position", "absolute")
      .style("display", "none")
      .append("div")
      .attr("class", "advanceFilterContent");

    //添加2个div作为左右布局
    this.advanceDetails = advanceFilter.append("div").attr("class", "left");
    this.advanceIcons = advanceFilter.append("div").attr("class", "right");

    //获取运动类别
    let categories = d3.groups(this.park, (d) => d.Sheet);
    categories = categories.filter((d) => d[0] !== "university");
    this.addIcons(categories);

    this.updateAdvanceFilters(this.radios[0]);
  }
  updateAdvanceFilters(data) {
    //循环添加筛选器radio
    //根据数组的object的属性个数来添加radio group
    let keys = Object.keys(data[1][0]);
    this.advanceDetails.selectAll("*").remove();
    let cate = this.advanceDetails
      .selectAll("div")
      .data(keys)
      .join("div")
      .attr("class", (d) => `radios ${d.replace(" ", "-")}`);
    //添加每个类别的标签
    cate
      .append("p")
      .attr("class", (d) => d)
      .html((d) => d);
    //循环添加radio和label
    let inputs = cate
      .selectAll("span")
      .data((d, i) => data[1].map((v) => v[d]).filter((d) => d))
      .join("span")
      .attr("class", (d) => d);

    inputs
      .append("input")
      .attr("class", (d) => {
        return `${d}`;
      })
      .attr("type", "checkbox")
      .attr("value", (d) => d)
      .html((d) => d);

    inputs
      .append("label")
      .html((d) => d)
      .on("click", (e) => {
        let clicked =
          d3.select(e.target.parentNode).select("input").property("checked") ??
          false;
        d3.select(e.target.parentNode)
          .select("input")
          .property("checked", clicked ? false : true);
      });

    //添加点击事件
    this.confirmButton = this.advanceDetails.append("button").html("confirm");
    //筛选数据
    let parentsClass;
    this.filters = [];
    this.confirmButton.on("click", () => {
      let radios = d3.selectAll(".left input:checked");
      radios._groups.map((d) => {
        d.forEach((v) => {
          parentsClass = d3
            .select(v.parentNode.parentNode)
            .attr("class")
            .split(" ")[1];
          this.filters.push([parentsClass.replace("-", " "), v.value]);
        });
        //调用事件后,清空this.filters
        //切换数据
        console.log(d3.groups(this.filters, (d) => d[0]));
        this.filters = d3.groups(this.filters, (d) => d[0]);
        this.filters = this.filters.map((d) => {
          return d[1].map((v) => {
            return { key: d[0], value: v[1] };
          });
        });
        this.infoData = this.park.filter(
          (v) => v.Sheet === this.selectedFilterCate
        );
        this.filters.forEach((d) => {
          this.infoData = this.infoData.filter((v) =>
            d.map((v) => v.value).includes(v[d[0].key])
          );
        });

        //如果没有数据则提示无数据
        this.infoData.length ===0?alert("No available facilities!"):null;
        //重画地图
        this.drawMap(this.infoData);
        //重新渲染tOP6
        this.addLeftLabels(this.infoData);
        this.filters = [];
      });
    });
  }
  addIcons(data) {
    let category = this.advanceIcons
      .selectAll("div")
      .data(data)
      .join("div")
      .attr("class", "rightIcons")
      .datum((d) => d[0]);
    let image = category.append("img").attr("src", (d) => `./images/${d}.png`);
    category.append("span").html((d) => d);

    //TODO添加事件
    image.on("click", (e, d) => {
      //筛选数据
      let data = this.radios.find((v) => v[0] === d);
      //
      this.selectedFilterCate = d;
      this.updateAdvanceFilters(data);

      //变更颜色
      let color = d3.select(e.target).style("background-color");
      //第二次点击恢复颜色
      d3.selectAll(this.advanceIcons.selectAll("img")).style(
        "background-color",
        null
      );
      d3.select(e.target).style("background-color", color);
      if (color === "rgba(0, 0, 0, 0)") {
        d3.select(e.target).style("background-color", "#ff00ff");
      } else {
        d3.select(e.target).style("background-color", "rgba(0, 0, 0, 0)");
      }
    });
  }
  initRadiosData(park) {
    this.radios = [
      [
        "Rinks",
        [
          {
            FACILITY_TYPE: "Arena",
            "Rink Type": " Puddle",
            "Boards Type": "Permanent",
            Toilet: "Yes",
            Lights: "Permanent",
          },
          {
            FACILITY_TYPE: "Community Centre",
            "Rink Type": "Rink",
            "Boards Type": " Seasonal",
            Toilet: "No",
            Lights: "Seasonal",
          },
          {
            FACILITY_TYPE: "Change Hut",
            "Rink Type": "Double Surface",
            "Boards Type": "None",
            Lights: "None",
          },
          {
            FACILITY_TYPE: "Fieldhouse",
            "Rink Type": "Rink with Puddle",
          },
          {
            FACILITY_TYPE: "Trailer",
          },
        ],
      ],

      [
        "Tennis",
        [
          {
            SURFACE_COLOUR: "Black",
            Lights: "Yes",
            COURT_TYPE: " Membership Clubs",
            ACCESSIBLE: "Yes",
          },
          {
            SURFACE_COLOUR: "Blue",
            Lights: "No",
            COURT_TYPE: "Practice Ball Wall",
            ACCESSIBLE: "No",
          },
          {
            SURFACE_COLOUR: "Green",
            "Court-type": " Private Clubs",
          },
          {
            SURFACE_COLOUR: "Clay",
            COURT_TYPE: "Public Courts",
          },
          {
            COURT_TYPE: " School Board Sites",
          },
        ],
      ],
      [
        "Sledding",
        [
          { ASSESSMENT: "Approved site", " ACCESSIBLE": " Yes" },
          { ASSESSMENT: "Approved site - Conditional ", " ACCESSIBLE": "No" },
        ],
      ],
      [
        "Skateboard",
        [
          {
            FACILITY_TYPE: "Bowl",
            FACILITY: " Community Center",
            ACCESSIBLE: "Yes",
          },
          {
            FACILITY_TYPE: "Flat",
            FACILITY: "Neighborhood",
            ACCESSIBLE: "No",
          },
          { FACILITY_TYPE: "Other Park", FACILITY: "", ACCESSIBLE: "" },
          { FACILITY_TYPE: "", "FACILITY ": "District", ACCESSIBLE: "" },
        ],
      ],
      [
        "Swimming",
        [
          { "POOL TYPE": "Full", ACCESSIBLE: "Yes" },
          { "POOL TYPE": "Other", ACCESSIBLE: "No" },
        ],
      ],
    ];
  }
}

new ParkMap();

function calcDistance(lat1, lng1, lat2, lng2) {
  var radLat1 = (lat1 * Math.PI) / 180.0;
  var radLat2 = (lat2 * Math.PI) / 180.0;
  var a = radLat1 - radLat2;
  var b = (lng1 * Math.PI) / 180.0 - (lng2 * Math.PI) / 180.0;
  var s =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin(a / 2), 2) +
          Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
      )
    );
  s = s * 6378.137;
  s = Math.round(s * 10000) / 10000;
  return s;
}
