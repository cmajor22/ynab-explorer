import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

const SankeyChart = ({ data }) => {
  const chartRef = useRef(null);
  const formatValue = (n) => {return Number(n).toLocaleString(undefined, {minimumFractionDigits: 2})}

  useEffect(() => {
    const svg = d3.select(chartRef.current);
    const hideValues = true;
    const width = 500;
    const height = 500;

    svg.selectAll('*').remove()
    svg
      .attr("width", "100")
      .attr("height", '100')
      .attr('viewBox','0 0 '+Math.min(width,height)+' '+Math.min(width,height))
      .attr('preserveAspectRatio','xMinYMin')
      .append("g") ;


    const s = sankey()
      .nodeWidth(15)
      .nodePadding(15)
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
        // .style('stroke', '#FFF')
        .style('stroke', d => {
          if (d.target.color) {
            return d.target.color;
          }
          return d.source.color;
        });

    chartNodes.append("title").text((item) => `${item.source.name}: $${!hideValues && formatValue(item.value)} (${item.percentage}%)`)

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
      .attr("font-size", 16)
      .attr('fill', '#e1e1e1')
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 8 : d.x0 - 2)
      .attr("y", d => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .text((item) => `${item.name}: $${!hideValues && formatValue(item.value)}`);
  })

  return (
    <svg ref={chartRef} style={{width: "100%", height: "50%"}}></svg>
  );
};

export default SankeyChart;