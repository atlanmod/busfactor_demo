__author__ = 'atlanmod'

import subprocess
import os
import signal
import sys
import time
import psutil
from selenium import webdriver
from git_tracker_gui import GitTracker

pro = None


def start_server():
    global pro
    print "Starting server..."
    cmd = 'python -m SimpleHTTPServer'
    pro = subprocess.Popen(cmd, shell=True)


def open_browser():
    driver = webdriver.Chrome(executable_path='C:\Program Files (x86)\Google\Chrome\chromedriver.exe')
    driver.get("http://localhost:8000/index.html")
    driver.refresh()

    return driver


def browser_is_open(driver):
    open = True
    try:
        driver.current_url
    except:
        open = False

    return open


def shutdown_server():
    print "Shutting down server..."
    os.kill(pro.pid, signal.SIGTERM)


def main():
    start_server()
    driver = open_browser()

    open = True
    while open:
        time.sleep(1)
        open = browser_is_open(driver)

    shutdown_server()

if __name__ == "__main__":
    main()
