var system = require("system")
  , page = require("webpage").create()
  , fs = require("fs")

// Read in arguments
var args = ["in", "out", "cwd", "runningsPath", "cssPath", "highlightCssPath", "paperFormat", "paperOrientation", "paperBorder", "renderDelay", "jsonPath"].reduce(function (args, name, i) {
  args[name] = system.args[i + 1]
  return args
}, {})

var html5bpPath = page.libraryPath + "/../html5bp"

var html = fs.read(html5bpPath + "/index.html")
  .replace(/\{\{baseUrl\}\}/g, "file://" + html5bpPath)
  .replace("{{content}}", fs.read(args.in))

page.setContent(html, "file://" + args.cwd + "/markdown-pdf.html")

// Add custom CSS to the page
page.evaluate(function (cssPaths) {
  var head = document.querySelector("head")

  cssPaths.forEach(function (cssPath) {
    var css = document.createElement("link")
    css.rel = "stylesheet"
    css.href = cssPath

    head.appendChild(css)
  })
}, [args.cssPath, args.highlightCssPath])

// Set the PDF paper size
page.paperSize = paperSize(args.runningsPath, {format: args.paperFormat, orientation: args.paperOrientation, border: args.paperBorder})

// Render the page
setTimeout(function () {
  page.render(args.out)
  page.close()
  phantom.exit(0)
}, parseInt(args.renderDelay, 10))

function paperSize (runningsPath, obj) {
  var runnings = require(runningsPath)

  // encapsulate .contents into phantom.callback()
  //   Why does phantomjs not support Array.prototype.forEach?!
  var keys = ["header", "footer"]
  for (var i = 0; i < keys.length; i++) {
    var which = keys[i]
    if (runnings[which]
      && runnings[which].contents
      && typeof runnings[which].contents === "function") {
      obj[which] = {
        contents: phantom.callback(runnings[which].contents)
      }
      if (runnings[which].height)
        obj[which].height = runnings[which].height
    }
  }
  
  return obj
}