from selenium import webdriver
from xvfbwrapper import Xvfb
import bs4
import sys

display = Xvfb()
display.start()

inputString = sys.argv[1]

driver = webdriver.Chrome("chromedriver")
driver.get('http://text-machine.cs.uml.edu/cliner/demo/cgi-bin/cliner_demo.cgi/')

# driver.execute_script("document.getElementById('user_input').style.body = 'block';")

text_box = driver.find_element_by_name('user_input')
text_box.send_keys(inputString)


btn = driver.find_element_by_name('my_form')
btn.submit()

soup = bs4.BeautifulSoup (driver.page_source, 'lxml')
src = soup.select ('p')

ans = src[0].getText()[166:]
s = ''
c = 1
for i in ans :
    if i == ">" :
        s += '></font>'
    elif i == "<" :
        s += '<font color = #FF0000><'
    else :
        s += i
print (ans)
# print (sys.argv[1])



driver.close()
display.stop()