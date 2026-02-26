#!/usr/bin/env -S qjs -m
import * as std from "std";
import { generateDefaultCSS } from '../src/utils/css.js';

const css = generateDefaultCSS();
std.out.puts(css);
