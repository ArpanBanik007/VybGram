import { Server, Socket } from "socket.io";

export let io ;



export const initSocket=(httpServer)=>{
    io= new Server(httpServer,{
          cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
    });



    

    
io.on("connection", (socket) => {
  console.log("Socket Connected", socket.id);

  socket.on("join-post", (postId) => {
    socket.join(`post:${postId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });
});



}
