import React, { useState, useEffect, useRef } from 'react';
import { Download, ArrowRight } from 'lucide-react';
import io from 'socket.io-client';
import { User, Mail, Star, TrendingUp, TrendingDown, FileText } from 'lucide-react';

const ChatInterface = ({ onLogReceived }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatus, setAgentStatus] = useState('');
  const [displayAgentStatus, setDisplayAgentStatus] = useState(false)
  const [isDisable, setIsDisable] = useState(false);
  const socket = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const [isRegistered, setIsRegistered] = useState(false);


  const INTERNAL_AGENT_SOCKET_URL = 'http://localhost:5000';

  useEffect(() => {
    const connectSocket = () => {
        const newSocket = io(INTERNAL_AGENT_SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          timeout: 20000,
          debug: true,
        });
        socket.current = newSocket;
  
        socket.current.on('connect', () => {
            console.log('Connected to backend');
            setIsConnected(true);
            socket.current.emit('register', JSON.stringify({ email: 'anas@fashion.ai' }));
          });
  
        socket.current.on('message', (message) => {
          console.log('Received message:', message);
        //   setMessages((prevMessages) => [...prevMessages, { sender: 'AI', text: message.data }]);
        });
  
        // socket.current.on('register_message', (message) => {
        //   console.log('Received register message:', message);
        //   if (message.data.startsWith('Registered with email:')) {
        //     setIsRegistered(true);
        //   }
        //   setMessages((prevMessages) => [...prevMessages, { sender: 'AI', text: message.data }]);
        // });
  
        socket.current.on('resume_ranking', (message) => {
          console.log('Received resume ranking:', message);
          setDisplayAgentStatus(false)

          setMessages((prevMessages) => [...prevMessages, { sender: 'AI', text: message }]);
        });
  
        socket.current.on('resume_filtered', (message) => {
          console.log('Received resume filtered:', message);
          setDisplayAgentStatus(false)

          setMessages((prevMessages) => [...prevMessages, { sender: 'AI', text: message }]);
        });
  
        socket.current.on('status', (status) => {
          console.log('Received status:', status);
          setAgentStatus(status);
        });
  
        socket.current.on('disconnect', () => {
          console.log('Disconnected from backend');
          setIsConnected(false);
          setIsRegistered(false);
          setTimeout(connectSocket, 3000);
        });
  
        socket.current.on('connect_error', (err) => {
          console.error('Connection error: ', err);
          setIsConnected(false);
        });
      };
  
      connectSocket();
  

    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    setDisplayAgentStatus(true)
    if (inputMessage.trim() !== '' && !isDisable) {
      socket.current.emit('chat_message', JSON.stringify({ text: inputMessage }));
      setMessages((prevMessages) => [...prevMessages, { sender: 'User', content: inputMessage }]);
      setInputMessage('');
    //   setIsDisable(true);
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  };

  const PDFDownloadLink = ({ filename }) => {
    const handleDownload = async () => {
      try {
        const response = await fetch(`http://localhost:5000/resume/${filename}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading file:', error);
        alert('Failed to download the file. Please try again.');
      }
    };
  
    return (
      <button
        onClick={handleDownload}
        className="text-blue-500 hover:text-blue-700 flex items-center"
      >
        <FileText size={18} className="mr-1" />
        {filename}
      </button>
    );
  };


  const renderMessage = (message) => {
    if (message.sender === 'User') {
      return (
        <div className="flex justify-end mb-4">
          <div className="bg-blue-500 text-white p-3 rounded-lg shadow-md max-w-md">
            {message.content}
          </div>
        </div>
      );
    } else {
      const content = message.text;
      console.log(content, "here");
      
      if (typeof content === 'object' && content !== null) {
        return (
          <div className="mb-4">
            <div className="bg-white rounded-lg shadow-md p-4 max-w-2xl">
              <div className="flex items-center mb-2">
                <Mail className="mr-2 text-gray-500" size={18} />
                <p className="text-sm text-gray-600">{content.email}</p>
              </div>
              {content.name && (
                <div className="flex items-center mb-3">
                  <User className="mr-2 text-gray-500" size={18} />
                  <h3 className="text-lg font-semibold text-gray-800">{content.name}</h3>
                </div>
              )}
              {content.score && (
                <div className="flex items-center mb-3">
                  <Star className="mr-2 text-yellow-500" size={18} />
                  <div className="flex-grow">
                    <div className="bg-gray-200 h-2 rounded-full">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{width: `${Math.min(content.score * 10, 100)}%`}}
                      ></div>
                    </div>
                  </div>
                  <span className="ml-2 font-bold text-gray-700">{content.score}</span>
                </div>
              )}
              {content.weak_zone && (
                <div className="mb-3">
                  <div className="flex items-center mb-1">
                    <TrendingDown className="mr-2 text-red-500" size={18} />
                    <h4 className="font-semibold text-red-600">Weak Zone:</h4>
                  </div>
                  <p className="text-gray-700 ml-6">{content.weak_zone}</p>
                </div>
              )}
              {content.strong_zone && (
                <div className="mb-3">
                  <div className="flex items-center mb-1">
                    <TrendingUp className="mr-2 text-green-500" size={18} />
                    <h4 className="font-semibold text-green-600">Strong Zone:</h4>
                  </div>
                  <p className="text-gray-700 ml-6">{content.strong_zone}</p>
                </div>
              )}

                {content.keep_reason && (
                <div className="mb-3">
                  <div className="flex items-center mb-1">
                    <TrendingUp className="mr-2 text-red-500" size={18} />
                    <h4 className="mr-2 text-green-500">Reason:</h4>
                  </div>
                  <p className="text-gray-700 ml-6">{content.keep_reason}</p>
                </div>
              )}
              {content.file_name && (
                <div className="mt-3">
                  <PDFDownloadLink filename={content.file_name} />
                </div>
              )}
            </div>
          </div>
        );
      } else {
        return (
          <div className="mb-4">
            <div className="bg-gray-100 p-3 rounded-lg shadow-sm max-w-md">
              {String(content)}
            </div>
          </div>
        );
      }
    }
  };


  return (
    <div className="flex flex-col h-screen bg-white p-4 relative">
      <div className={`w-3 h-3 rounded-full absolute top-2 right-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <div className="flex-grow overflow-y-auto mb-4 p-4 bg-gray-100 rounded-xl" ref={chatContainerRef}>
      {messages.map((message, index) => (
          <React.Fragment key={index}>
            {renderMessage(message)}
          </React.Fragment>
        ))}
        {agentStatus && displayAgentStatus && (
          <div className="text-center text-gray-500 italic">{agentStatus}</div>
        )}
      </div>
      <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm">
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={handleInputChange}
          placeholder="Enter your requirements here..."
          className="flex-grow py-3 px-4 bg-transparent focus:outline-none resize-none overflow-y-auto max-h-[100px]"
          style={{ minHeight: '48px' }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isDisable}
        />
        <div className="flex items-center pr-3 space-x-3">
          <button className="text-gray-400 hover:text-gray-600">
            <Download size={20} />
          </button>
          <button 
            className={`${isDisable ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600'} text-white rounded-full p-2`}
            onClick={handleSendMessage}
            disabled={isDisable}
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;