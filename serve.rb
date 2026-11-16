# frozen_string_literal: true

require "webrick"

ROOT = File.expand_path("public", __dir__)
PORT = Integer(ENV.fetch("PORT", "4567"))

TYPES = {
  ".html" => "text/html; charset=utf-8",
  ".css" => "text/css; charset=utf-8",
  ".js" => "text/javascript; charset=utf-8",
  ".png" => "image/png",
  ".jpg" => "image/jpeg",
  ".jpeg" => "image/jpeg",
  ".webp" => "image/webp",
  ".gif" => "image/gif",
  ".svg" => "image/svg+xml"
}.freeze

class AppServlet < WEBrick::HTTPServlet::AbstractServlet
  def do_GET(req, res)
    path = req.path == "/" ? "/index.html" : req.path
    file = File.expand_path(path.delete_prefix("/"), ROOT)
    unless file.start_with?(ROOT + File::SEPARATOR) && File.file?(file)
      res.status = 404
      res["Content-Type"] = "text/plain; charset=utf-8"
      res.body = "not found"
      return
    end

    res["Content-Type"] = TYPES.fetch(File.extname(file), "application/octet-stream")
    res.body = File.binread(file)
  end
end

server = WEBrick::HTTPServer.new(BindAddress: "127.0.0.1", Port: PORT, AccessLog: [])
server.mount("/", AppServlet)
trap("INT") { server.shutdown }
$stdout.sync = true
puts "特価画像: http://127.0.0.1:#{PORT}"
server.start
