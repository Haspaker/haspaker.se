express = require \express
http = require \http

const static_dir = './static'
const homepage = static_dir + '/html/main.html'

app = express()

app.use '/html', express.static( static_dir + '/html' )
app.use '/css', express.static( static_dir + '/css' )
app.use '/js', express.static( static_dir + '/js' )

app.get '/' (req, res) -> setTimeout (-> res.sendfile homepage), 0

app.get '/img/:tail' (req, res) -> setTimeout (-> res.sendfile static_dir + req.path), 0

stutter = 0

app.get '/img/:middle/:tail' (req, res) -> setTimeout (-> res.sendfile static_dir + req.path), 0

app.set \port, process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8000
app.set \ip, process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1"

http.createServer(app).listen app.get(\port), app.get(\ip)
