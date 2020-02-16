express = require \express

const static_dir = './public'
const homepage = static_dir + '/html/main.html'

app = express()

app.use express.static( static_dir )

app.get '/' (req, res) -> res.sendfile homepage

server_port = process.env.PORT || 8000

app.listen server_port, -> console.log "Listening to port #server_port at #server_ip_address"
