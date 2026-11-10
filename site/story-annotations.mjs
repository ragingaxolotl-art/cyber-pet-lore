export const annotationChoices=[['all','All annotations'],['interpretation','DBA interpretations'],['editorial','Editorial explanations'],['off','Story only']];
export function annotationVisible(block,mode='all'){
 if(!block.annotation)return true;
 if(mode==='off')return false;
 return mode==='all'||block.annotation.layer==='frame'||block.annotation.layer===mode;
}
