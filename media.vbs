Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\mediaserver"
WshShell.Run "cmd /c node server.js", 0, False
