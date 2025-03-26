# My personal new tab page

[![License](https://img.shields.io/badge/license-unlicense-green)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/lfavole/wallpaper-changer-rs)](https://github.com/lfavole/wallpaper-changer-rs/stargazers)
[![Last commit](https://img.shields.io/github/last-commit/lfavole/wallpaper-changer-rs)](https://github.com/lfavole/wallpaper-changer-rs/commits/main)

## Overview

This is a personal new tab page with custom features and design. This project is aimed at enhancing your browser's new tab experience with personalized content and layout.

## Features

- Customizable widgets
- Personalized greeting and background

## Demo

Check out the live demo [here](https://lfnewtab.vercel.app).

## Installation

Clone the repository and open the webpage:

```bash
git clone https://github.com/lfavole/newtab.git
cd newtab
firefox newtab/index.html
```

## Publishing to addons.mozilla.org

```bash
# Install web-ext
npm install --global web-ext

# Build the extension
web-ext build

# Publish the extension
web-ext sign --channel listed --api-key "JWT issuer" --api-secret "JWT secret"
```
