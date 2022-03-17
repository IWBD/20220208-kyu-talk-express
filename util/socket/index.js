const { Server } = require( 'socket.io' )
const { getRedisClient } = require( '../redis' )
const _ = require( 'lodash' )
const redisClient = getRedisClient()
let socketIo

function conntectSocket( server ) {
  socketIo = new Server( server,  {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  } )
  socketIo.on( 'connection', socket => {
    socket.on( 'login', async ( userId ) => {
      redisClient.set( userId, socket.id )
    } )
  } )
}

async function pushClient( eventName, pushList ) {
  const socketIdList = []
  for( let i = 0; i < pushList.length; i++ ) {
    const { userId, params } = pushList[i]
    const socketId = await redisClient.get( userId )
    socketId && socketIdList.push( { socketId, params } )
  }

  for( let i = 0; i < socketIdList.length; i++ ) {
    socketIo.to( socketIdList[i].socketId ).emit( eventName, socketIdList[i].params )
  }
}

function getSocketIo() {
  return socketIo
}

module.exports = { conntectSocket, getSocketIo, pushClient }