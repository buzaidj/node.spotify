var artistIdSet = new Set();
var visited = new Set();

var graph = {
  nodes: [],
  links: []
};

function make_force_graph() {
  graph.nodes.forEach(x => {
    var myImage = new Image(160, 160);
    myImage.src = x.img.url;
    x.img = myImage
  })
  var myGraph = ForceGraph();
  myGraph(document.getElementById('graph'))
    .nodeCanvasObject(({ img, x, y }, ctx) => {
      const size = 30;
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    })
    .nodePointerAreaPaint((node, color, ctx) => {
      const size = 30;
      ctx.fillStyle = color;
      ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size); // draw square as pointer trap
    })
    .graphData(graph)
    .nodeRelSize(80)
    .d3Force('collide', d3.forceCollide(function (d) {
      return d.id === "j" ? 100 : 30
    }))
    .linkDirectionalArrowLength(10);;
}

function make_graph() {
  console.log("Time to make graph");
  var elements = graph.nodes.map(x => { return { data: { id: x.id } }; }).concat(graph.links.map(x => {
    return {
      data: {
        id: x.source + x.target,
        source: x.source,
        target: x.target
      }
    };
  }));
  document.getElementById('pp').innerHTML = "HELLO!";
  console.log("Heres the elements");
  console.log(elements);
  var cy = cytoscape({
    container: document.getElementById('cy'), // container to render in
    elements: elements,
    style: [ // the stylesheet for the graph
      {
        selector: 'node',
        style: {
          'background-color': '#666',
        }
      },

      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#000',
          'target-arrow-color': '#000',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier'
        }
      }
    ],
    layout: {
      name: 'grid',
      rows: 5
    },
    // initial viewport state:
    zoom: 1,
    pan: { x: 0, y: 0 },

    // interaction options:
    minZoom: 1e-50,
    maxZoom: 1e50,
    zoomingEnabled: true,
    userZoomingEnabled: true,
    panningEnabled: true,
    userPanningEnabled: true,
    boxSelectionEnabled: true,
    selectionType: 'single',
    touchTapThreshold: 8,
    desktopTapThreshold: 4,
    autolock: false,
    autoungrabify: false,
    autounselectify: false,

    // rendering options:
    headless: false,
    styleEnabled: true,
    hideEdgesOnViewport: false,
    textureOnViewport: false,
    motionBlur: false,
    motionBlurOpacity: 0.2,
    wheelSensitivity: 1,
    pixelRatio: 'auto',

  });
}

link_hash = new Map();

var id_count = 0

function get_neighbors(access_token, id, max_depth, curr_depth = 1, is_last = true, source_id = "") {
  // console.log(id_count);
  if (id_count >= 1000) {
    return;
  }
  if (curr_depth >= max_depth) {
    return;
  }
  if (visited.has(id)) {
    console.log("been here!");
    return;
  }
  visited.add(id);
  $.get({
    url: "https://api.spotify.com/v1/artists/" + id + "/related-artists",
    headers: {
      "Authorization": "Bearer " + access_token
    },
    tryCount: 0,
    retryLimit: 3,
    async: true,
    success: function (response) {
      response.artists.map(x => x.id).filter(x => x != id).forEach(
        function (new_id, idx, arr) {
          // const new_dist = (new_id in graph.links) ? Math.min(link_hash[new_id].dist, curr_depth) : curr_depth;
          var idx_s = graph.nodes.map(x => x.id).indexOf(id);
          var idx_t = graph.nodes.map(x => x.id).indexOf(new_id);
          id_count += 1;
          const myID = id_count;
          if (idx_s > 0 && idx_t > 0) {
            graph.links.push({
              id: myID,
              source: source_id,
              target: new_id,
              weight: max_depth - curr_depth
            });
          }

          if (idx == arr.length - 1 && curr_depth == max_depth - 1 && is_last) {
            make_force_graph();
          }
          var last_one = (idx == arr.length - 1 && is_last)
          get_neighbors(access_token, new_id, max_depth, curr_depth + 1, last_one, source_id);
        }
      )
    },
    error: function (xhr, textStatus, errorThrown) {
      if (textStatus == 'timeout') {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          //try again
          $.ajax(this);
          return;
        }
        return;
      }
      if (xhr.status == 500) {
        //handle error
      } else {
        //handle error
      }
    }

  });
}


/** gets top artists*/
function get_top_artists(access_token, n_artists) {
  if (n_artists > 50) {
    n_artists = 50;
  }
  else if (n_artists < 10) {
    n_artists = 10;
  }
  $.getJSON({
    url: "https://api.spotify.com/v1/me/top/artists",
    // crossDomain: true,
    data: {
      limit: String(n_artists),
      offset: "1"
    },
    headers: {
      "Authorization": "Bearer " + access_token
    },
    async: true,
    success: function (response) {
      response.items.map(x => x.id).forEach(
        x => artistIdSet.add(x)
      );
      graph.nodes = graph.nodes.concat(response.items.map(x => {
        return {
          name: x.name,
          id: x.id,
          img: x.images.length > 0 ? x.images[x.images.length - 1] : "",
          popularity: x.popularity
        }
      }));
      Array.from(artistIdSet).forEach(
        (artist_id, idx, arr) => {
          get_neighbors(access_token, artist_id, 2, 1, idx == arr.length - 1, artist_id);
        }
      );
      graph.links = Array.from(link_hash.entries());
      console.log(graph);
    },
    error: function (err) {
      console.error(err);
    },
  });

}
$(document).ready(function () {
  var params = new URLSearchParams(window.location.hash.substring(1));
  if (params.has("access_token") && params.has("token_type")) {
    const access_token = params.get("access_token");
    const token_type = params.get("token_type");
    console.log(access_token);
    get_top_artists(access_token, 30);
  }

  else {
    window.location.replace('../');
  }
});