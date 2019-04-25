workflow "Build and publish" {
  resolves = ["build"]
  on = "push"
}

action "svgr" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  args = "run svgr"
}

action "generate entrypoints" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  needs = ["svgr"]
  args = "run generate entrypoints"
}

action "build" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  needs = ["generate entrypoints"]
  args = "run build"
}
