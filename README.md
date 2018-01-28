### Ripple meta parser


#### Make module from Browserify
```
npm install browserify -g

browserify main.js --s metaparser > metaparser.js
```

Then in html
```

<script>metaparser.orderChanges(text);</script>
```
