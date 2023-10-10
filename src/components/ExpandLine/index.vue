<template>
  <div id="expandLine">
    <div class="vertical-line"></div>
    <div class="horizontal-line"></div>
  </div>
</template>
<script setup lang="ts" name="ExpandLine"></script>
<style lang="scss" scoped>
.vertical-line {
  height: 26px;
  border-right: 1px solid #a9a9a9;
  float: left;
  margin-top: -10px;
  margin-left: -25px;
}
.horizontal-line {
  width: 20px;
  border-top: 1px solid #a9a9a9;
  float: left;
  margin-top: 16px;
  margin-left: -25px;
}
</style>
