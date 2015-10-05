express = require \express

const static_dir = './static'
const homepage = static_dir + '/html/main_rework.html'

app = express()

app.use express.static( static_dir )

app.get '/' (req, res) -> res.sendfile homepage

server_port = process.env.OPENSHIFT_NODEJS_PORT || 8000
server_ip_address = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1"

app.listen server_port, server_ip_address, -> console.log "Listening to port #server_port at #server_ip_address"
