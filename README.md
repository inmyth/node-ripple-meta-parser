### Ripple meta parser


#### Make module from Browserify
```
npm install -g browserify

browserify main.js --s metaparser > metaparser.js
```

Then in html
```

<script>metaparser.orderChanges(text, myRippleAddress, true);</script>
```
