import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

const SankeyChart = ({ data }) => {
  const chartRef = useRef(null);
  const formatValue = (n) => {return Number(n).toLocaleString(undefined, {minimumFractionDigits: 2})}
  const getTitle = (item) => {
    return (item.titleFrom === 'source') ? item.source.name : item.target.name;
  }

  useEffect(() => {
    const svg = d3.select(chartRef.current);
    const hideValues = false;
    const width = 800;
    const height = 800;

    svg.selectAll('*').remove()
    svg
      .attr('viewBox','0 0 '+Math.min(width,height)+' '+Math.min(width,height))
      .attr('preserveAspectRatio','xMinYMin')
      .append("g");

    const s = sankey()
      .nodeWidth(15)
      .nodePadding(15)
      .nodeSort(null)
      .size([width, height])

    const { nodes, links } = s(data);

    const chartNodes = svg.append('g')
      .selectAll('.link')
      .data(links)
      .enter().append('path')
        .attr('class', 'link')
        .attr('d', sankeyLinkHorizontal())
        .attr('stroke-width', d => Math.max(1, d.width))
        .style('fill', 'none')
        .style('stroke-opacity', .15)
        .style('stroke', d => {
          if (d.target.color) {
            return d.target.color;
          }
          return d.source.color;
        })
        .on('mouseover', function (d, i) {
          d3.selectAll('text')
            .transition()
            .duration('1')
            .attr('opacity', 1)
          d3.selectAll('.link')
            .transition()
            .duration('500')
            .style('stroke-opacity', .05)
          d3.select(this).transition()
            .duration('100')
            .style('stroke-opacity', .25)
          d3.selectAll('text')
            .transition()
            .duration('500')
            .attr('opacity', .1)
          d3.selectAll('text').filter((item) => {
            return item.name===d.srcElement.__data__.source.name || item.name===d.srcElement.__data__.target.name
          })
            .transition()
            .duration('501')
            .attr('opacity', 1)
        })
        .on('mouseout', function (d, i) {
          d3.selectAll('.link')
            .transition()
            .duration('500')
            .style('stroke-opacity', .15)
          d3.select(this).transition()
            .duration('100')
            .style('stroke-opacity', .15)
          d3.selectAll('text')
            .transition()
            .duration('500')
            .attr('opacity', 1)
        })

    chartNodes.append("title")
      .text((item) => `${getTitle(item)}${!hideValues ? `: $${formatValue(item.value)} (${item.percentage}%)` : ''}`)

    svg.append('g')
      .selectAll('.node')
      .data(nodes)
      .enter().append('rect')
        .attr('class', 'node')
        .attr('x', d => d.x0 + 1)
        .attr('y', d => d.y0)
        .attr('height', d => d.y1 - d.y0)
        .attr('width', d => d.x1 - d.x0)
        .attr('marginBottom', 5)
        .style('fill', d => d.color)
        .style('fill-opacity', 0.5)
        .style('marginLeft', '20px')

    svg.append("g")
      .attr("font-family", 'roboto')
      .attr("font-size", 12)
      .attr('fill', '#e1e1e1')
      .attr('opacity', 1)
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 8 : d.x0 - 2)
      .attr("y", d => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .text((item) => `${item.name}${!hideValues ? `: $${formatValue(item.value)}` : ''}`);

    svg.selectAll(".link")
      .attr('stroke-width', 0)
      .transition()
      .delay((d, i) => i*5)
      .duration(500)
      .attr('stroke-width', d => Math.max(1, d.width))
  })

  return (
    <svg ref={chartRef} style={{width: "100%", height: "100%"}}></svg>
  );
};

export default SankeyChart;